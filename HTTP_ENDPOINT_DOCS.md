# HTTP Endpoint Documentation for Chat Webhook

## Quick Start

### 1. Start the Server

```bash
npm run server
```

The server will start on `http://localhost:3001`

### 2. Endpoint URL

**Base URL:** `http://localhost:3001`

**Chat Endpoint:** `POST http://localhost:3001/webhook/chat`

---

## HTTP Node Configuration

### URL
```
http://localhost:3001/webhook/chat
```

### Method
```
POST
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body Format (JSON)

**Required Fields:**
```json
{
  "message": "Your message text here",
  "module": "invoice"
}
```

**Full Example with Optional Fields:**
```json
{
  "message": "Process this invoice please",
  "module": "invoice",
  "sessionId": "session_123456",
  "timestamp": "2025-11-30T12:00:00.000Z"
}
```

---

## Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `message` | string | ✅ Yes | The user's message text | `"Process this document"` |
| `module` | string | ✅ Yes | Module to route to | `"invoice"`, `"kdr"`, `"ga"`, or `"kdri"` |
| `sessionId` | string | ❌ No | Unique session identifier | `"session_1234567890"` |
| `timestamp` | string | ❌ No | ISO timestamp | `"2025-11-30T12:00:00.000Z"` |

---

## Available Modules

| Module | Value | Description |
|--------|-------|-------------|
| Invoice Processing | `invoice` | Process invoice documents |
| KDR Processing | `kdr` | Process KDR documents |
| GA Processing | `ga` | Process GA documents |
| KDR Invoicing | `kdri` | Process KDR invoicing |

---

## Response Format

### Success Response

```json
{
  "success": true,
  "response": "Message processed successfully",
  "data": {
    "message": "Your response from n8n webhook",
    "additionalData": "..."
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message details",
  "response": "Sorry, I encountered an error processing your message. Please try again."
}
```

---

## Example HTTP Requests

### Using cURL

```bash
curl -X POST http://localhost:3001/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Process this invoice",
    "module": "invoice",
    "sessionId": "session_123"
  }'
```

### Using Node.js HTTP Node (n8n)

**URL:** `http://localhost:3001/webhook/chat`

**Method:** POST

**Body:**
```json
{
  "message": "{{$json.userMessage}}",
  "module": "invoice",
  "sessionId": "{{$json.sessionId}}",
  "timestamp": "{{$now}}"
}
```

### Using JavaScript fetch()

```javascript
const response = await fetch('http://localhost:3001/webhook/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Process this document',
    module: 'invoice',
    sessionId: 'session_123',
    timestamp: new Date().toISOString()
  })
});

const data = await response.json();
console.log(data);
```

### Using Python requests

```python
import requests
import json
from datetime import datetime

url = "http://localhost:3001/webhook/chat"
payload = {
    "message": "Process this invoice",
    "module": "invoice",
    "sessionId": "session_123",
    "timestamp": datetime.utcnow().isoformat() + "Z"
}

response = requests.post(url, json=payload)
print(response.json())
```

---

## File Upload (Multipart Form Data)

For uploading files with the message, use `multipart/form-data`:

### cURL with Files

```bash
curl -X POST http://localhost:3001/webhook/chat \
  -F "message=Process this invoice" \
  -F "module=invoice" \
  -F "sessionId=session_123" \
  -F "files=@/path/to/document.pdf" \
  -F "files=@/path/to/image.jpg"
```

### JavaScript FormData

```javascript
const formData = new FormData();
formData.append('message', 'Process these documents');
formData.append('module', 'invoice');
formData.append('sessionId', 'session_123');
formData.append('files', fileInput.files[0]);
formData.append('files', fileInput.files[1]);

const response = await fetch('http://localhost:3001/webhook/chat', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
```

---

## Additional Endpoints

### Health Check

**URL:** `GET http://localhost:3001/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T12:00:00.000Z",
  "endpoints": {
    "chat": "/webhook/chat"
  }
}
```

### Configuration Info

**URL:** `GET http://localhost:3001/webhook/config`

**Response:**
```json
{
  "modules": ["invoice", "kdr", "ga", "kdri"],
  "endpoints": {
    "chat": {
      "url": "/webhook/chat",
      "method": "POST",
      "contentType": "application/json or multipart/form-data",
      "requiredFields": ["message", "module"],
      "optionalFields": ["sessionId", "timestamp", "files"]
    }
  }
}
```

---

## Environment Variables

The server reads webhook URLs from environment variables. Create a `.env` file:

```env
PORT=3001
VITE_INVOICE_WEBHOOK_URL=https://n8n.srv1009033.hstgr.cloud/webhook/invoice
VITE_KDR_WEBHOOK_URL=https://your-n8n-instance.com/webhook/kdr
VITE_GA_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ga
VITE_KDRI_WEBHOOK_URL=https://your-n8n-instance.com/webhook/kdri
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Message processed |
| 400 | Bad Request - Missing required fields |
| 500 | Server Error - Failed to process message |

---

## Testing the Endpoint

1. **Start the server:**
   ```bash
   npm run server
   ```

2. **Test with cURL:**
   ```bash
   curl -X POST http://localhost:3001/webhook/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test", "module": "invoice"}'
   ```

3. **Check health:**
   ```bash
   curl http://localhost:3001/health
   ```

---

## Production Deployment

For production deployment, consider:

1. **Use HTTPS** - Deploy behind a reverse proxy (nginx, Apache)
2. **Environment Variables** - Configure all webhook URLs
3. **Rate Limiting** - Add rate limiting middleware
4. **Authentication** - Add API key or JWT authentication
5. **Monitoring** - Add logging and monitoring tools
6. **Process Manager** - Use PM2 or similar for process management

### Example with PM2

```bash
npm install -g pm2
pm2 start server.js --name chat-webhook-api
pm2 save
pm2 startup
```

---

## Support

For issues or questions:
1. Check server logs for errors
2. Verify webhook URLs in `.env` file
3. Test endpoints with health check
4. Review WEBHOOK_SETUP.md for n8n configuration
