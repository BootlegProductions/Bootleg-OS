// Shared with the Weather app: Open-Meteo locations/current data; clocks use Intl.
export const WEATHER_PLACE_KEY='bootlegWeatherPlace';
export function describeWeather(code){
 if(code===0)return 'Clear sky';if(code===1)return 'Mainly clear';if(code===2)return 'Partly cloudy';if(code===3)return 'Overcast';if([45,48].includes(code))return 'Fog';if(code>=51&&code<=57)return 'Drizzle';if(code>=61&&code<=67)return 'Rain';if(code>=71&&code<=77)return 'Snow';if(code>=80&&code<=82)return 'Rain showers';if(code>=85&&code<=86)return 'Snow showers';if(code>=95)return 'Thunderstorm';return 'Conditions unavailable';
}
export async function findPlace(name,fetcher=fetch){
 const r=await fetcher('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name,count:'1',language:'en',format:'json'}),{signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Location lookup is unavailable.');const p=(await r.json()).results?.[0];if(!p)throw Error('I couldn’t find that place. Try the town name, or use the Weather app.');
 return {lat:p.latitude,lon:p.longitude,label:[p.name,p.admin1,p.country].filter(Boolean).join(', '),timezone:p.timezone};
}
export function timeAnswer(place=null,date=new Date()){
 const zone=place?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone;
 if(!zone)throw Error('That location has no time zone available.');
 const clock=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(date);
 const day=new Intl.DateTimeFormat('en-GB',{timeZone:zone,weekday:'long',day:'numeric',month:'long'}).format(date);
 return `${place?`Time in ${place.label}`:'Your local time'}: ${clock} · ${day}. Time zone: ${zone}. This uses your device clock, like the World Clock app.`;
}
export async function weatherAnswer(place,{fetcher=fetch,snapshot=null}={}){
 let data;
 if(snapshot&&Date.now()-snapshot.checkedAt<300000&&Math.abs(snapshot.lat-place.lat)<.001&&Math.abs(snapshot.lon-place.lon)<.001)data=snapshot.data;
 else{
  const r=await fetcher('https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({latitude:place.lat,longitude:place.lon,timezone:'auto',current:'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day'}),{signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('Weather data is unavailable right now. Try again or open the Weather app.');data=await r.json();
 }
 const c=data.current;if(!c||!Number.isFinite(c.temperature_2m))throw Error('No current weather was returned for that place.');
 const feels=Number.isFinite(c.apparent_temperature)?`, feels like ${Math.round(c.apparent_temperature)}°C`:'';
 const wind=Number.isFinite(c.wind_speed_10m)?` Wind: ${Math.round(c.wind_speed_10m)} km/h.`:'';
 return `${place.label}: ${describeWeather(c.weather_code)}, ${Math.round(c.temperature_2m)}°C${feels}.${wind} Current weather model update: ${c.time.replace('T',' ')} (${data.timezone||place.timezone||'local time'}). Source: Open-Meteo.`;
}
