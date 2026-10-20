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
  if(/\b(fuck(?:ing|er)?|shit|bitch|bastard|cunt|asshole|arsehole|idiot|stupid)\b/i.test(q))return {text:'Baka! 😤 Mind your language around my pixels. Shall we try that again?',suggestions:['Sorry, Boots','Help me with a tool','Just chatting'],mood:'angry'};
  if(/\b(?:what(?:'s| is) my name|remember my name)\b/.test(q))return {text:name?`You told me your name is ${name}!`:'You haven’t told me yet. Try “My name is …”.',suggestions:['How are you?','Show me the tools']};
  if(/^(hi|hello|hey|hiya|yo)( there| boots)?[!.? ]*$/.test(q)||/^(good morning|good afternoon|good evening)[!.? ]*$/.test(q))return {text:welcome(),suggestions:['Show me the tools','Find a project','Just chatting']};
  if(/^(how are you|how'?s it going|you okay|how are you doing|how are you feeling|how'?s your day|how was your day|what are you up to)[?.! ]*$/.test(q)){
   const hour=new Date().getHours(),sleepy=hour>=22||hour<8;
   return {text:sleepy?'A little sleepy, if I’m honest. I was just reading through the site before I nodded off. How are you?':'Pretty good! I’ve been wandering between the projects and the blog. How’s your day going?',suggestions:['What have you been reading?','Doing good','A bit tired'],mood:sleepy?'sleepy':'talk'};
  }
  if(/^(i (?:just )?woke up|just woke up|good morning boots)[!.? ]*$/.test(q))return {text:'Morning! I was nearly asleep myself. Want something easy to explore while you wake up?',suggestions:['Recommend an article','Explore the gallery','What’s the weather?'],mood:'sleepy'};
  if(/^(bad|rough|not great|i'?m (?:sad|stressed|having a bad day)|feeling (?:sad|stressed))[!. ]*$/.test(q))return {text:'Sorry it’s been a rough one. We can take it easy—want a distraction, some music, or just a chat?',suggestions:['Pirate Radio','Recommend an article','Just chatting']};
  if(/^(what have you been reading|recommend (?:an? )?article|what should i read|read anything interesting|tell me something interesting)[?.! ]*$/.test(q)){
   const articles=[
    ['I’ve been reading the tower’s Linux story. Reusing old hardware and finding a new purpose for it sounds very Bootleg OS to me.','blog-pages/install-linux-mint.html'],
    ['The Jellyfin guide turns a folder of videos into a library you can actually browse. The permissions bit is where the tower needed some patience.','blog-pages/jellyfin-home-server.html'],
    ['The terminal guide starts with finding your way around, then gets into drives and logs. Much less mysterious when every command has a job.','blog-pages/linux-terminal.html'],
    ['I’ve been exploring the Internet Archive article. There’s a time machine for old websites in there, and it explains where the radio’s source links come from.','blog-pages/internet-archive.html'],
    ['I’ve been reading about why Oliver still makes personal websites. I like the idea of one little corner of the internet with room to grow.','blog-pages/technology.html'],
    ['The YouTube story starts with an iPod taped to a chair. Things improved from there!','blog-pages/starting-youtube.html'],
    ['The Bootleg OS introduction explains how the projects, art and tools ended up under one roof.','blog-pages/about-bootleg-os.html']
   ];
   const pick=articles[Math.floor(Math.random()*articles.length)];
   return {text:pick[0],href:pick[1],suggestions:['Another article','Explore the gallery','Show me the tools'],mood:'explain'};
  }
  if(/^(another article|something else to read)[?.! ]*$/.test(q))return {text:'There are more stories in the blog, from web tools to creative projects. Pick whichever title catches your eye.',href:'blog.html',suggestions:['Recommend an article','Find a project']};
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


