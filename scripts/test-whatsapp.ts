import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { WhatsAppService } from '../services/whatsapp/WhatsAppService';

async function main(){
  try{
    const wa = new WhatsAppService();
    const result = await wa.sendTemplate({
      to: process.env.WHATSAPP_NOTIFY_PHONE || '',
      templateName: 'hello_world',
      languageCode: 'en_US',
    });
    console.log('WhatsApp template send result:', JSON.stringify(result, null, 2));
  }catch(err){
    console.error('WhatsApp test script error:', err);
    process.exit(1);
  }
}

main();
