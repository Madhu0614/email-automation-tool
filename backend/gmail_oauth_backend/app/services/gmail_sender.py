from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
from email.mime.text import MIMEText

def send_gmail_oauth(to_email, subject, body, access_token):
    creds = Credentials(token=access_token)
    service = build('gmail', 'v1', credentials=creds)

    message = MIMEText(body)
    message['to'] = to_email
    message['subject'] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    send_message = {'raw': raw}
    result = service.users().messages().send(userId='me', body=send_message).execute()
    return result
