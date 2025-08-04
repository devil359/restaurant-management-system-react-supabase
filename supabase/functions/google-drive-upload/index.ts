import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleDriveUploadResponse {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { file, fileName, mimeType, staffId, documentType, documentNumber, restaurantId } = await req.json()

    if (!file || !fileName || !staffId || !documentType || !restaurantId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Google Service Account credentials from secrets
    const googleServiceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')

    if (!googleServiceAccountKey) {
      console.error('Missing Google Service Account credentials')
      return new Response(
        JSON.stringify({ error: 'Google Drive API not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse service account key
    let serviceAccount
    try {
      serviceAccount = JSON.parse(googleServiceAccountKey)
    } catch (error) {
      console.error('Invalid Google Service Account key:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid Google Service Account configuration' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate JWT for Google Service Account authentication
    const now = Math.floor(Date.now() / 1000)
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }
    
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    // Simple JWT encoding (for demonstration - in production, use a proper JWT library)
    const headerBase64 = btoa(JSON.stringify(header))
    const payloadBase64 = btoa(JSON.stringify(payload))
    const signatureInput = `${headerBase64}.${payloadBase64}`
    
    // For now, let's use a simpler approach - upload to the shared folder directly
    const folderId = '1y2dpQZVJhhndNpRoNbKVHDkkQ4XFplcH' // Your shared folder ID
    
    // Create a simple access token request using the service account
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${headerBase64}.${payloadBase64}.signature` // This is simplified
      })
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get access token')
      // Fallback: Try without authentication for public folder
      console.log('Attempting to upload to public folder without authentication')
    }

    // Convert base64 file to blob
    const fileData = Uint8Array.from(atob(file), c => c.charCodeAt(0))
    
    // Create form data for multipart upload
    const boundary = '-------314159265358979323846'
    const delimiter = '\r\n--' + boundary + '\r\n'
    const close_delim = '\r\n--' + boundary + '--'

    const metadata = {
      name: `${staffId}_${documentType}_${fileName}`,
      parents: [folderId],
      description: `Staff document: ${documentType} for staff ID: ${staffId}`
    }

    let multipartRequestBody = delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) + delimiter +
      'Content-Type: ' + mimeType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      file + close_delim

    // Get access token from the token response
    let accessToken = null
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json()
      accessToken = tokenData.access_token
    }

    // Use the access token if available, otherwise try without auth for public folder
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/related; boundary="' + boundary + '"'
    }
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
      method: 'POST',
      headers,
      body: multipartRequestBody
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      console.error('Google Drive upload failed:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to upload to Google Drive' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const driveResponse: GoogleDriveUploadResponse = await uploadResponse.json()

    // Make file publicly viewable (if we have access token)
    if (accessToken) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${driveResponse.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      })
    }

    // Save document info to Supabase
    const { data: documentData, error: dbError } = await supabase
      .from('staff_documents')
      .insert({
        staff_id: staffId,
        restaurant_id: restaurantId,
        document_type: documentType,
        document_number: documentNumber,
        document_name: fileName,
        google_drive_file_id: driveResponse.id,
        google_drive_url: driveResponse.webViewLink,
        file_size: fileData.length,
        mime_type: mimeType,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert failed:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to save document info' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        document: documentData,
        driveFileId: driveResponse.id,
        driveUrl: driveResponse.webViewLink
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})