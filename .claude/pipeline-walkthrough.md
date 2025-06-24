Below is a "white-box" walk-through of what happens—from the moment a user types a place name all the way to hearing the synthetic narration—together with the exact LLM prompts in play.

---

## 1. Location search (client ➜ server ➜ Nominatim)

**Client**  
• Component: `LocationSearch.tsx` (and related hooks)  
• Calls `GET /locations/search` every time the debounced query changes.

**Server**  
• Route – `app/routers/locations.py → /search`  
• Delegates to `LocationService.search_locations` which:
1. Assembles a cache-key and checks Redis.  
2. If there's a miss, fires an HTTP request to the public Nominatim endpoint.  
3. Normalises the JSON into our internal schema and returns it.  
• Results (plus auto-complete suggestions) are cached for **1 hour**, so repeating the same query is free.

---

## 2. Customisation UI (interests • duration • language)

**Client**  
• Component: `TourGenerator.tsx` exposes:  
&nbsp;&nbsp;* 15 canned interests + free-text chips  
&nbsp;&nbsp;* Duration slider (10 – 180 min)  
&nbsp;&nbsp;* Language dropdown (ISO-2 codes)  
&nbsp;&nbsp;* Optional TTS voice/speed could be added similarly  

```10:33:frontend/src/components/tour/TourGenerator.tsx
const AVAILABLE_INTERESTS = [ 'history', 'culture', 'architecture', … ]
```

• As soon as any parameter changes it calls `GET /tours/estimate-cost`, giving the user **live price feedback** without spending any tokens.

---

## 3. Kick-off tour generation

**Client**  
• Pressing **"Generate"** triggers `POST /tours/generate` with a `TourGenerationRequest` payload (`location_id`, `interests[]`, `duration_minutes`, `language`).

**Server**  
• `app/routers/tours.py → generate_tour` stores a **placeholder** row in Postgres (`status = "generating"`) then spawns a background task `_generate_tour_content_background` inside `TourService`.

---

## 4. Textual content generation (LLM phase)

**Background task flow**  
1. Retrieves full location metadata (name, city, …).  
2. Calls `AIService.generate_tour_content` which:  
   • Builds an *ultra-concise* prompt (see below).  
   • Looks in Redis for a **cache hit** (7-day TTL).  
   • If miss, sends the prompt to the preferred model (**OpenAI GPT-4o-mini** by default) and automatically falls back to **Claude-Haiku** on error.  
   • Parses/validates the JSON; stores provider metadata; caches result.

### Prompt building
```238:247:app/services/ai_service.py
prompt = f"""Create {duration_minutes}min audio tour for {location['name']}, {location.get('city', '')}.
Focus: {interests_text}
Language: {language}

Return JSON:
{{"title": "engaging title", "content": "conversational {duration_minutes}-minute narration script with clear sections"}}

Requirements:
- Conversational audio style
- {duration_minutes} minutes of content
- Include fascinating facts and stories
- Clear section transitions
- Engaging for all ages"""
```

### System-message wrapper (used for both providers)
```190:199:app/services/ai_service.py
"role": "system",
"content": "You are an expert travel guide. Create engaging audio tour content. Return only valid JSON with 'title' and 'content' fields."
```

**Why it's cheap**  
• Interests list is **truncated to 3** items to save tokens.  
• The entire prompt is &lt; 60 tokens; output length ≈ `duration_minutes × 50` tokens.  
• **Caching** makes subsequent identical requests free.

---

## 5. Audio generation (TTS phase)

• Once the text is ready the same background task calls `AIService.generate_audio`.  
• Uses **OpenAI TTS-1** with the voice in `settings.OPENAI_TTS_VOICE` (defaults to **"alloy"**).  
• Audio bytes are base-64 encoded and cached in Redis for **30 days**; the public streaming URL is `/tours/{tour_id}/audio`.  
• If TTS takes longer than 60 s the task proceeds without audio (`status` stays `content_ready` so the user still gets the script).

```300:325:app/services/ai_service.py
response = await self.openai_client.audio.speech.create(
    model=settings.OPENAI_TTS_MODEL,
    voice=voice,
    input=text,
    speed=speed
)
```

---

## 6. Finalisation & user feedback

• Database row is updated to `status = "ready"`, real title/content, `audio_url`, plus `llm_provider` and `llm_model` for analytics.  
• Front-end `TourStatusTracker` polls `/tours/{id}/status`; when it flips to **"ready"** the player is shown and the audio stream URL is loaded.

---

## Prompt summary

| Step | Prompt involvement |
|------|--------------------|
| Location search | **None** – pure Nominatim |
| Tour content | Combined *system prompt* + *dynamic user prompt* (above) |
| Audio | No prompt – plain text fed into OpenAI TTS-1 |

---

That's the complete pipeline: **search ➜ select ➜ generate JSON script (LLM) ➜ synthesise speech ➜ stream to the PWA**, with aggressive caching and automatic model fall-back throughout. 