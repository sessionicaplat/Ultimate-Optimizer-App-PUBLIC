import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import { useState } from "react";
import { Page, Layout, Card, Banner, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { ContentGenerator, type ContentInputType } from "../components/blog/ContentGenerator";
import { CreditService, OperationType, InsufficientCreditsError } from "../services/credit.service";
import { JobService } from "../services/job.service";
import { blogQueueManager } from "../services/blog-queue.manager";
import { JobType } from "../components/shared/types";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const creditService = new CreditService(db);
  const creditBalance = await creditService.getBalance(session.shop);

  return {
    shop: session.shop,
    creditBalance: creditBalance.balance,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const inputType = formData.get("inputType") as ContentInputType;
  const inputValue = formData.get("inputValue") as string;
  const suggestions = formData.get("suggestions") as string;
  
  if (!inputType || !inputValue) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const creditService = new CreditService(db);
    const jobService = new JobService(db);
    
    // Check credit balance
    const creditBalance = await creditService.getBalance(session.shop);
    const creditCost = 25; // Base cost for blog generation
    
    if (creditBalance.balance < creditCost) {
      return Response.json({ error: "Insufficient credits" }, { status: 400 });
    }

    // Create job
    const jobInput = {
      inputType,
      inputValue,
      suggestions: suggestions ? JSON.parse(suggestions) : undefined,
    };

    const { totalCost } = await creditService.validateAndReserveCredits(
      session.shop,
      OperationType.BLOG_CONTENT_GENERATION,
      1
    );

    let job: Awaited<ReturnType<JobService["createJob"]>>;

    try {
      job = await jobService.createJob(
        session.shop,
        JobType.BLOG_OPTIMIZATION,
        jobInput,
        creditCost
      );
    } catch (jobCreationError) {
      await creditService.refundCredits(
        session.shop,
        totalCost,
        "Failed to create blog generation job"
      );
      throw jobCreationError;
    }

    await blogQueueManager.enqueueBlogJob(job.id, session.shop);

    // Redirect to job progress page
    return redirect(`/app/blog-progress/${job.id}`);
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return Response.json({ error: "You do not have enough credits to generate this blog." }, { status: 400 });
    }

    console.error("Error creating blog generation job:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to create blog generation job" 
    }, { status: 500 });
  }
};

export default function BlogGenerate() {
  const { creditBalance } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [formData, setFormData] = useState<{
    inputType: ContentInputType;
    inputValue: string;
    suggestions?: string[];
  } | null>(null);

  const isSubmitting = navigation.state === "submitting";

  const handleGenerate = (inputType: ContentInputType, inputValue: string, suggestions?: string[]) => {
    setFormData({ inputType, inputValue, suggestions });
    
    // Submit form programmatically
    const form = document.getElementById('blog-generation-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <Page
      title="Generate Blog Content"
      subtitle="Create SEO-optimized blog posts from keywords, products, URLs, or videos"
      backAction={{ url: "/app/blog" }}
    >
      <Layout>
        <Layout.Section>
          {actionData?.error && (
            <Banner tone="critical" title="Error">
              <Text variant="bodyMd" as="p">
                {actionData.error}
              </Text>
            </Banner>
          )}

          <ContentGenerator
            onGenerate={handleGenerate}
            loading={isSubmitting}
            creditCost={25}
            disabled={creditBalance < 25}
          />

          {creditBalance < 25 && (
            <Card>
              <div style={{ padding: "16px" }}>
                <Banner tone="warning" title="Insufficient Credits">
                  <Text variant="bodyMd" as="p">
                    You need at least 25 credits to generate blog content. 
                    Current balance: {creditBalance} credits.
                  </Text>
                </Banner>
              </div>
            </Card>
          )}
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <div style={{ padding: "16px" }}>
              <Text variant="headingMd" as="h2">
                What You'll Get
              </Text>
              <div style={{ marginTop: "12px" }}>
                <ul style={{ paddingLeft: "16px", margin: 0 }}>
                  <li>SEO-optimized blog title</li>
                  <li>Comprehensive article outline</li>
                  <li>Full blog content (1000+ words)</li>
                  <li>Meta description and keywords</li>
                  <li>Featured image suggestions</li>
                  <li>Brand voice alignment</li>
                </ul>
              </div>
              
              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "var(--p-color-bg-surface-secondary)", borderRadius: "8px" }}>
                <Text variant="bodySm" tone="subdued" as="p">
                  <strong>Credit Balance:</strong> {creditBalance} credits
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  <strong>Cost per generation:</strong> 25 credits
                </Text>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>

      <div style={{ height: "48px" }} aria-hidden="true" />

      {/* Hidden form for submission */}
      <Form method="post" id="blog-generation-form" style={{ display: 'none' }}>
        <input type="hidden" name="inputType" value={formData?.inputType || ''} />
        <input type="hidden" name="inputValue" value={formData?.inputValue || ''} />
        <input type="hidden" name="suggestions" value={formData?.suggestions ? JSON.stringify(formData.suggestions) : ''} />
      </Form>
    </Page>
  );
}
