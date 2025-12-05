# Install @wix/media Package

## Quick Install

Run this in the backend directory:

```bash
cd backend
npm install
```

This will install the newly added `@wix/media` package.

## What Was Added

In `backend/package.json`:
```json
"@wix/media": "^1.0.0"
```

## Verify Installation

After running `npm install`, check that the package is installed:

```bash
npm list @wix/media
```

You should see:
```
@wix/media@1.0.0
```

## TypeScript Error

If you see this error in your IDE:
```
Cannot find module '@wix/media' or its corresponding type declarations
```

It will resolve after running `npm install`.

## Next Steps

After installation:
1. Commit the changes
2. Push to Render
3. Render will automatically run `npm install` during deployment
4. Test the blog image upload feature
