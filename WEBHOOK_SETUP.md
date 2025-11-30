# Webhook Integration Setup Guide

This application has been configured to communicate with n8n workflows via webhooks. Each module has its own dedicated webhook URL for isolated processing.

## Overview

The chat system now sends messages directly to n8n workflow webhooks instead of allowing peer-to-peer chat. This ensures:
- Each user interacts with an n8n workflow
- Complete chat isolation between users (via unique session IDs)
- Support for file attachments
- Real-time responses from your workflows

## Configuration

### 1. Environment Variables

Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

### 2. Update Webhook URLs

Edit the `.env` file and replace the placeholder URLs with your actual n8n webhook URLs:

```env
VITE_INVOICE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/invoice
VITE_DOCUMENT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/document
VITE_KDR_WEBHOOK_URL=https://your-n8n-instance.com/webhook/kdr
VITE_GA_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ga
VITE_KDRI_WEBHOOK_URL=https://your-n8n-instance.com/webhook/kdri
```

## Webhook Payload Structure

Each webhook receives the following data via FormData:

```javascript
{
  message: string,           // User's message text
  module: string,            // Module name (invoice, document, kdr, ga, kdri)
  sessionId: string,         // Unique session ID for chat isolation
  timestamp: string,         // ISO timestamp
  fileCount: string,         // Number of files attached (if any)
  file_0: File,             // First file (if attachments present)
  file_1: File,             // Second file (if attachments present)
  // ... additional files
}
```

## Expected Webhook Response

Your n8n workflow should return a JSON response with the following structure:

```json
{
  "message": "Your response message here",
  "response": "Alternative response field (optional)"
}
```

The application will display either the `message` or `response` field from your webhook.

## n8n Workflow Setup Example

Here's a basic n8n workflow structure for each webhook:

1. **Webhook Node** (POST method)
   - Respond: Using 'Respond to Webhook' Node
   - Response Mode: When Last Node Finishes

2. **Function Node** (Process the incoming data)
   ```javascript
   const message = $json.body.message;
   const sessionId = $json.body.sessionId;
   const module = $json.body.module;
   const fileCount = parseInt($json.body.fileCount || '0');

   // Your processing logic here

   return {
     message: "Processing complete!",
     sessionId: sessionId
   };
   ```

3. **Respond to Webhook Node**
   ```javascript
   {
     "message": "{{ $json.message }}"
   }
   ```

## Chat Isolation

Each user session generates a unique `sessionId` when they open a chat module. This ID is sent with every message to your webhook, allowing you to:
- Track conversation context per user
- Store chat history separately for each session
- Maintain complete isolation between different users

## File Handling

When users attach files:
- Files are sent as FormData entries named `file_0`, `file_1`, etc.
- The `fileCount` field indicates the total number of files
- Your n8n workflow can access files using the Binary Data feature

## Error Handling

If your webhook:
- Returns an error status (4xx or 5xx)
- Times out
- Is unreachable

The user will see a friendly error message: "Sorry, I encountered an error processing your message. Please try again."

## Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Login and navigate to any module
3. Send a test message
4. Verify the message reaches your n8n webhook
5. Check that the response appears in the chat

## Security Considerations

- Use HTTPS URLs for production webhooks
- Implement authentication in your n8n workflows if needed
- Validate the `sessionId` to prevent unauthorized access
- Sanitize user input before processing
- Set appropriate CORS headers on your n8n instance

## Module Webhook Mapping

| Module | Webhook Environment Variable | Default Key |
|--------|------------------------------|-------------|
| Invoice Processing | `VITE_INVOICE_WEBHOOK_URL` | `invoice` |
| Document Processing | `VITE_DOCUMENT_WEBHOOK_URL` | `document` |
| KDR Processing | `VITE_KDR_WEBHOOK_URL` | `kdr` |
| GA Processing | `VITE_GA_WEBHOOK_URL` | `ga` |
| KDR Invoicing | `VITE_KDRI_WEBHOOK_URL` | `kdri` |

## Troubleshooting

### Webhook not receiving messages
- Check that the webhook URL is correct in `.env`
- Verify your n8n workflow is active
- Check browser console for error messages
- Ensure CORS is properly configured on your n8n instance

### Files not uploading
- Check n8n workflow has binary data handling enabled
- Verify file size limits on your n8n instance
- Check browser console for upload errors

### Session isolation not working
- Verify `sessionId` is being sent in the payload
- Check your n8n workflow is storing sessions separately
- Clear browser cache and test with incognito mode

## Support

For issues related to:
- This application: Check the browser console for errors
- n8n workflows: Refer to [n8n documentation](https://docs.n8n.io/)
- Webhook configuration: Review this guide and verify environment variables
