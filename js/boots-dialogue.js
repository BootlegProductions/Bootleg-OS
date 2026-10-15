// Small, predictable conversation rules. Names live only in this chat session.
export function createDialogue(){
 let name='';
 const welcome=()=>`Hello${name?`, ${name}`:' there'}! How can I help you today?`;
 function reply(input){
  const text=input.trim(),q=text.toLowerCase().replace(/[’]/g,"'");
  const intro=text.match(/^(?:(?:hi|hello|hey)(?: there)?[,!]?\s+)?(?:my name is|call me|i['’]m|i am)\s+([\p{L}][\p{L}'’\-]{0,23})(?:[.! ]*)$/iu);
  if(intro&&!/^(tired|bored|sad|happy|fine|good|okay|ok|lost|stuck|angry|lonely|confused|hungry|sleepy|here|back|sorry|new|ready|great|sure|not)$/i.test(intro[1])){
   name=intro[1][0].toUpperCase()+intro[1].slice(1);return {text:`Nice to meet you, ${name}! What would you like to explore?`,suggestions:['Show me the tools','Find a project','Just chatting']};
  }
  if(/\b(fuck(?:ing|er)?|shit|bitch|bastard|cunt|asshole|arsehole|idiot|stupid)\b/i.test(q))return {text:'Baka! 😤 Mind your language around my pixels. Shall we try that again?',suggestions:['Sorry, Boots','Help me with a tool','Just chatting']};
  if(/\b(?:what(?:'s| is) my name|remember my name)\b/.test(q))return {text:name?`You told me your name is ${name}!`:'You haven’t told me yet. Try “My name is …”.',suggestions:['How are you?','Show me the tools']};
  if(/^(hi|hello|hey|hiya|yo)( there| boots)?[!.? ]*$/.test(q)||/^(good morning|good afternoon|good evening)[!.? ]*$/.test(q))return {text:welcome(),suggestions:['Show me the tools','Find a project','Just chatting']};
  if(/^(how are you|how'?s it going|you okay|how are you doing)[?.! ]*$/.test(q))return {text:'All pixels accounted for! How are you doing?',suggestions:['Doing good','A bit tired','Show me the tools']};
  if(/^(doing good|i'?m good|good|fine|great|not bad|i'?m fine)[!. ]*$/.test(q))return {text:'Glad to hear it! Making something today, or having a look around?',suggestions:['Make some pixel art','Explore the gallery']};
  if(/^(a bit tired|i'?m tired|tired|sleepy|i'?m sleepy)[!. ]*$/.test(q))return {text:'I know that feeling. Even a pixel girl needs a sleep state. Want something relaxed to browse?',suggestions:['Explore the gallery','Read the blog','Pirate Radio']};
  if(/^(sorry(?:,? boots)?|my bad|apologies)[!. ]*$/.test(q))return {text:'Truce! Pixel peace restored. What shall we do next?',suggestions:['Show me the tools','Just chatting']};
  if(/^(thanks|thank you|cheers|thanks boots|thank you boots)[!. ]*$/.test(q))return {text:`You’re welcome${name?`, ${name}`:''}! Anything else?`,suggestions:['Show me the tools','Find a project']};
  if(/^(bye|goodbye|see you|see ya|goodnight|good night)[!. ]*$/.test(q))return {text:`See you later${name?`, ${name}`:''}! I’ll be here keeping an eye on the pixels.`,suggestions:['Show me the tools','Explore the gallery']};
  if(/^(just chatting|tell me about yourself|who are you|what'?s your name)[?.! ]*$/.test(q))return {text:'I’m Boots, the little pixel guide around here. I can help with the tools, find a project or check the time and weather. What should I call you?',suggestions:['How are you?','Show me the tools']};
  if(/^(yes|yeah|yep|sure|okay|ok|no|nope)[!. ]*$/.test(q))return {text:'What would you like to do next?',suggestions:['Show me the tools','Find a project','Just chatting']};
  return null;
 }
 return {reply,welcome};
}
