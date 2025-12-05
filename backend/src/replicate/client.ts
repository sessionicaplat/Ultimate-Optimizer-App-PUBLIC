import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MODEL_ID = process.env.REPLICATE_IMAGE_MODEL || 'google/nano-banana';
const POLL_INTERVAL_MS = 1500;
const MAX_WAIT_MS = Number(process.env.REPLICATE_MAX_WAIT_MS || 60000);
const MAX_RETRIES = 2;

export interface ImageOptimizationInput {
  prompt: string;
  image_input?: string[];
  aspect_ratio?: string;
  output_format?: 'jpg' | 'png';
}

export interface ImageOptimizationOutput {
  url: string;
}

/**
 * Optimize an image using Replicate's nano-banana model (LEGACY - synchronous)
 * Use createImageOptimizationPrediction + pollPrediction for better performance
 */
export async function optimizeImage(
  imageUrl: string | null,
  prompt: string
): Promise<string> {
  const hasInputImage = Boolean(imageUrl);
  const input: ImageOptimizationInput = {
    prompt,
    aspect_ratio: hasInputImage
      ? 'match_input_image'
      : process.env.REPLICATE_DEFAULT_ASPECT_RATIO || '1:1',
    output_format: 'jpg',
  };
  if (hasInputImage) {
    input.image_input = [imageUrl!];
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log('[Replicate] Starting image optimization attempt', attempt, {
        hasInputImage,
        prompt: prompt.substring(0, 60) + (prompt.length > 60 ? '…' : ''),
      });

      const prediction = await replicate.predictions.create({
        model: MODEL_ID,
        input,
      });

      const finalPrediction = await waitForPrediction(prediction.id);

      if (finalPrediction.status !== 'succeeded') {
        throw new Error(String(finalPrediction.error || finalPrediction.status));
      }

      const optimizedUrl = extractOutputUrl(finalPrediction.output);
      if (!optimizedUrl) {
        throw new Error('Replicate returned no output URL');
      }

      console.log('[Replicate] Image optimization completed:', optimizedUrl);
      return optimizedUrl;
    } catch (error: any) {
      console.error(
        `[Replicate] Image optimization attempt ${attempt} failed:`,
        error?.message || error
      );

      if (attempt === MAX_RETRIES) {
        throw new Error(`Replicate API error: ${error?.message || error}`);
      }

      await sleep(POLL_INTERVAL_MS * attempt);
    }
  }

  throw new Error('Replicate image optimization failed');
}

/**
 * Optimize an image asynchronously (two-phase: create + poll separately)
 * Returns prediction ID immediately without waiting
 */
export async function optimizeImageAsync(
  imageUrl: string | null,
  prompt: string
): Promise<string> {
  const hasInputImage = Boolean(imageUrl);
  const input: ImageOptimizationInput = {
    prompt,
    aspect_ratio: hasInputImage
      ? 'match_input_image'
      : process.env.REPLICATE_DEFAULT_ASPECT_RATIO || '1:1',
    output_format: 'jpg',
  };
  if (hasInputImage) {
    input.image_input = [imageUrl!];
  }

  try {
    console.log('[Replicate] Creating async prediction', {
      hasInputImage,
      prompt: prompt.substring(0, 60) + (prompt.length > 60 ? '…' : ''),
    });

    const prediction = await replicate.predictions.create({
      model: MODEL_ID,
      input,
    });

    console.log('[Replicate] Prediction created:', prediction.id);
    return prediction.id;
  } catch (error: any) {
    console.error('[Replicate] Failed to create prediction:', error);
    throw new Error(`Replicate API error: ${error?.message || error}`);
  }
}

/**
 * Create a prediction for async processing
 */
export async function createImageOptimizationPrediction(
  imageUrl: string,
  prompt: string
): Promise<string> {
  try {
    const hasInputImage = Boolean(imageUrl);
    const input: ImageOptimizationInput = {
      prompt,
      aspect_ratio: hasInputImage
        ? 'match_input_image'
        : process.env.REPLICATE_DEFAULT_ASPECT_RATIO || '1:1',
      output_format: 'jpg',
    };
    if (hasInputImage) {
      input.image_input = [imageUrl];
    }

    const prediction = await replicate.predictions.create({
      model: MODEL_ID,
      input,
    });

    console.log('[Replicate] Created prediction:', prediction.id);

    return prediction.id;
  } catch (error: any) {
    console.error('[Replicate] Failed to create prediction:', error);
    throw new Error(`Replicate API error: ${error.message}`);
  }
}

/**
 * Get prediction status and result
 */
export async function getPrediction(predictionId: string): Promise<{
  status: string;
  output?: string;
  error?: string;
}> {
  try {
    const prediction = await replicate.predictions.get(predictionId);

    return {
      status: prediction.status,
      output: extractOutputUrl(prediction.output),
      error: prediction.error ? String(prediction.error) : undefined,
    };
  } catch (error: any) {
    console.error('[Replicate] Failed to get prediction:', error);
    throw new Error(`Replicate API error: ${error.message}`);
  }
}

/**
 * Poll a prediction until completion (for async workflow)
 * Returns result when ready, throws on error
 */
export async function pollPrediction(predictionId: string): Promise<string> {
  try {
    const finalPrediction = await waitForPrediction(predictionId);

    if (finalPrediction.status !== 'succeeded') {
      throw new Error(String(finalPrediction.error || finalPrediction.status));
    }

    const optimizedUrl = extractOutputUrl(finalPrediction.output);
    if (!optimizedUrl) {
      throw new Error('Replicate returned no output URL');
    }

    return optimizedUrl;
  } catch (error: any) {
    throw new Error(`Replicate polling error: ${error?.message || error}`);
  }
}

/**
 * Cancel a prediction
 */
export async function cancelPrediction(predictionId: string): Promise<void> {
  try {
    await replicate.predictions.cancel(predictionId);
    console.log('[Replicate] Canceled prediction:', predictionId);
  } catch (error: any) {
    console.error('[Replicate] Failed to cancel prediction:', error);
    throw new Error(`Replicate API error: ${error.message}`);
  }
}

export default replicate;

async function waitForPrediction(predictionId: string) {
  let elapsed = 0;
  let prediction = await replicate.predictions.get(predictionId);

  while (
    prediction.status === 'starting' ||
    prediction.status === 'processing'
  ) {
    if (elapsed >= MAX_WAIT_MS) {
      throw new Error('Prediction timed out');
    }

    await sleep(POLL_INTERVAL_MS);
    elapsed += POLL_INTERVAL_MS;
    prediction = await replicate.predictions.get(predictionId);
  }

  return prediction;
}

function extractOutputUrl(output: any): string | undefined {
  if (!output) {
    return undefined;
  }

  if (typeof output === 'string') {
    return output;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const url = extractOutputUrl(item);
      if (url) {
        return url;
      }
    }
    return undefined;
  }

  if (typeof output === 'object') {
    if (typeof (output as any).url === 'string') {
      return (output as any).url;
    }

    if (typeof (output as any).href === 'string') {
      return (output as any).href;
    }

    if (typeof (output as any).url === 'function') {
      const result = (output as any).url();
      if (typeof result === 'string') {
        return result;
      }
      if (result && typeof result.then === 'function') {
        console.warn('[Replicate] Received async FileOutput, skipping direct conversion.');
      }
    }
  }

  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
