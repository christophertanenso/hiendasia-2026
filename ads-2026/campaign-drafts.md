# HiEnd Asia 2026: Meta and Google campaign drafts

Drafted 28 Nov 2026. Show: 17–19 Dec 2026, Level 3, Suntec Singapore. Lucky draw registration closes 5 Dec.

The Meta campaigns exist as unpublished drafts in Ads Manager. G1 and G2 are live in Google Ads; G3 is built and paused (see below). Total budget: S$1,500, of which S$1,000 is Meta and S$500 is Google.

## Budget split

| Platform | Campaign | Budget | Runs |
| --- | --- | --- | --- |
| Meta | M1 Registrations, prospecting | S$540 | 30 Nov to 16 Dec |
| Meta | M2 Video awareness | S$180 | 30 Nov to 14 Dec |
| Meta | M3 Retargeting | S$150 | 1 to 16 Dec |
| Meta | M4 Show days | S$130 | 16 to 19 Dec |
| Google | G1 Search | S$140 campaign total | 28 Nov to 19 Dec |
| Google | G2 Demand Gen (YouTube, Discover, Gmail) | S$360 campaign total | 28 Nov to 16 Dec |
| Google | G3 Demand Gen remarketing | S$70 campaign total, paused; only serves if the visitor list qualifies | 9 to 18 Dec |

The Meta budgets are lifetime budgets on the ad sets. The Google budgets are campaign totals over the dates shown. Spend about 40% of the total by 5 Dec, while the lucky draw deadline gives people a reason to act.

## Images

All in `images/`, named `hea26_<concept>_<size>.jpg`. Each concept comes in four sizes.

| Size | Use on Meta | Use on Google |
| --- | --- | --- |
| square 1080×1080 | Feed, Marketplace | Demand Gen square |
| portrait 1080×1350 | Feed (preferred on mobile) | Demand Gen portrait |
| story 1080×1920 | Stories, Reels | Not used |
| landscape 1200×628 | Right column, Audience Network | Demand Gen landscape |

`hea26_logo_1200x1200.png` is the square logo Google asks for.

Story images keep the top 14% and bottom 20% clear for the app’s own buttons.

## Meta

Ad account: HiEnd Asia AdAccount. Pixel: HiEnd Asia Website. Optimise M1 and M3 for the `CompleteRegistration` event, not link clicks: last year’s paid social traffic engaged at 13%.

### M1 Registrations, prospecting

- **Objective:** Leads, conversion location Website, event `CompleteRegistration`.
- **Location:** Singapore, people living there. **Age:** 25–65+.
- **Placements:** Advantage+ placements.
- **Budget:** S$540 at campaign level.
- **Audience:** one broad ad set, Advantage+ audience on, no interests. M1 is an Advantage+ leads campaign, which has no interest targeting; decided 28 Nov 2026 to keep it broad rather than turn Advantage+ off and split S$540 three ways.
- **Ads:** A (to 5 Dec), B, F, G, H, I, J and Carousel 1.

### M2 Video awareness

- **Objective:** Awareness, optimised for ThruPlay.
- **Creative:** the 1:05 showcase video (`video/showcase-2025.mp4` in the site folder), with ad B’s text.
- **Audience:** Singapore, 25–65+, broad with Advantage+ audience on.
- **Why:** people who watch half of it become the M3 audience, and that list does not depend on cookie consent.
- **Note:** the file is 480p. Use the original export if you have one.

### M3 Retargeting

- **Objective:** Leads, event `CompleteRegistration`.
- **Include:** video viewers at 50% or more (30 days), Facebook and Instagram engagers (60 days), website visitors (30 days).
- **Exclude:** people who fired `CompleteRegistration` (30 days).
- **Ads:** the three retargeting messages below, one after another. The images are the prospecting ones; only the text changes.

#### R1 · Lucky draw nudge

- **Runs:** 1 to 5 Dec
- **Images:** A
- **Primary text:** Still thinking about HiEnd Asia? Your free ticket takes a minute to claim. Register by 5 Dec and you’re also in the daily lucky draw. 17–19 Dec, Level 3, Suntec Singapore.
- **Headline:** Register by 5 Dec. Daily Lucky Draw (35)
- **Description:** Tap to get your free ticket
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_retarget_R1&utm_content={{ad.name}}`

#### R2 · Still deciding

- **Runs:** 6 to 11 Dec
- **Images:** C, D and Carousel 2
- **Primary text:** Still deciding? Come and hear it for yourself: three days of listening rooms, the big names in hi-fi and NOWASIA art on Level 3, Suntec. 17–19 Dec. Your ticket is free and registering takes a minute.
- **Headline:** Your Free Ticket Is Still Waiting (33)
- **Description:** Tap to get your free ticket
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_retarget_R2&utm_content={{ad.name}}`

#### R3 · Countdown

- **Runs:** 12 to 16 Dec
- **Images:** B and D
- **Primary text:** One week to go. HiEnd Asia opens 17 Dec on Level 3, Suntec Singapore. Register now and your free ticket is ready at the door. It takes a minute.
- **Headline:** Opens 17 Dec. Get Your Free Ticket (34)
- **Description:** Tap to get your free ticket
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_retarget_R3&utm_content={{ad.name}}`

### M4 Show days

- **Objective:** Awareness, optimised for reach, frequency cap of 2 a day.
- **Location:** Singapore, plus a second ad set for a 5 km radius around Suntec.
- **Schedule:** 16 Dec 6pm to 19 Dec 5pm.
- **Ad:** E, linking to the show page with a Get Directions button.

### Meta ad copy

#### A · Lucky draw deadline

- **Runs:** Now to 5 Dec, 11:59pm
- **Images:** `hea26_A-luckydraw_*.jpg`
- **Primary text:** Register for your free HiEnd Asia ticket by 5 December and you are in the daily lucky draw. Three winners every day of the show, 17–19 Dec at Suntec Singapore.
- **Headline:** Register by 5 Dec for the Lucky Draw (36)
- **Description:** Tap to get your free ticket (27)
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_luckydraw&utm_content={{ad.name}}`

#### B · The show is back

- **Runs:** Now to 16 Dec
- **Images:** `hea26_B-show_*.jpg`
- **Primary text:** Singapore’s hi-fi show is back. Hear the big names in dedicated listening rooms, with turntables, vinyl and NOWASIA art galleries on the same floor. 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.
- **Headline:** Your Free HiEnd Asia Ticket Is Waiting (38)
- **Description:** Tap to get your free ticket (27)
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_show&utm_content={{ad.name}}`

#### C · Keynote talks

- **Runs:** 6 to 16 Dec
- **Images:** `hea26_C-keynotes_*.jpg`
- **Primary text:** Eleven keynote sessions over three days. Hear Richard H. Mak of Mono & Stereo and Daniel Hsu of PaPa Dan AV Lab in the listening rooms at HiEnd Asia, 17–19 Dec, Suntec Singapore. Your ticket is free when you register online.
- **Headline:** Free Ticket: 11 Keynote Sessions (32)
- **Description:** Tap to get your free ticket (27)
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_keynotes&utm_content={{ad.name}}`

#### D · Free entry

- **Runs:** 6 to 16 Dec
- **Images:** `hea26_D-free_*.jpg`
- **Primary text:** Three days of listening rooms, turntables, speakers and art on Level 3 of Suntec Singapore, 17–19 Dec. One free ticket gets you in on any day. Register online; it takes a minute.
- **Headline:** One Free Ticket, Any Day You Like (33)
- **Description:** Tap to get your free ticket (27)
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_free&utm_content={{ad.name}}`

#### E · On now

- **Runs:** 17 to 19 Dec, 9am–5pm
- **Images:** `hea26_E-showdays_*.jpg`
- **Primary text:** HiEnd Asia is open now at Suntec Singapore. Listening rooms, the big names in hi-fi and art galleries on Level 3. Free entry, 10am–7pm, until Saturday 19 Dec.
- **Headline:** On Now at Suntec. Free Entry (28)
- **Description:** Level 3 · 10am–7pm (18)
- **Button:** Get Directions
- **Link:** `https://www.hiendasia.com/?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_showdays&utm_content={{ad.name}}`

#### H · Billy Ho live

- **Runs:** Now to 16 Dec
- **Images:** `hea26_H-billyho_*.jpg`
- **Primary text:** EB Duet at HiEnd Asia: the jazz duo’s guitarist and producer, Billy Ho, plays solo guitar live at the show, including a new song. 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.
- **Headline:** See EB Duet’s Billy Ho. Free Ticket (35)
- **Description:** Tap to get your free ticket (27)
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_billyho&utm_content={{ad.name}}`

#### I · Hi-fi and art

- **Runs:** Now to 16 Dec
- **Images:** `hea26_I-art_*.jpg`
- **Primary text:** HiEnd Asia shares Level 3 of Suntec Singapore with the NOWASIA art galleries: high-end hi-fi in dedicated listening rooms, and contemporary art a few steps away. 17–19 Dec. Your ticket is free when you register online. It takes a minute.
- **Headline:** Hi-Fi and Art. One Free Ticket (30)
- **Description:** Tap to get your free ticket (27)
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_art&utm_content={{ad.name}}`

#### J · Listening rooms come alive

- **Runs:** Now to 16 Dec
- **Images:** `hea26_J-live_*.jpg`
- **Primary text:** Hi-fi is better with people in the room. Three days of listening rooms, live music and art at HiEnd Asia, 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.
- **Headline:** Listening Rooms, Live Music, Free Ticket (40)
- **Description:** Tap to get your free ticket (27)
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_live&utm_content={{ad.name}}`

#### F · Brands coming

- **Runs:** Now to 16 Dec
- **Images:** `hea26_F-brands_*.jpg`
- **Primary text:** Audio-Technica, Accuphase, Wilson Audio, Pass Labs, Clearaudio, TAD and many more are coming to HiEnd Asia. Hear them in dedicated listening rooms, 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.
- **Headline:** Hear the Big Names. Get a Free Ticket (37)
- **Description:** Tap to get your free ticket (27)
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_brands&utm_content={{ad.name}}`

#### G · HiEnd Asia albums

- **Runs:** Now to 16 Dec
- **Images:** `hea26_G-albums_*.jpg`
- **Primary text:** The HiEnd Asia commemorative albums are on sale at the show: the 2023, 2024 and 2025 CDs and the limited-edition 45 rpm double LP. 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.
- **Headline:** HiEnd Asia Commemorative CDs & LP (33)
- **Description:** Tap to get your free ticket (27)
- **Button:** Get Offer
- **Link:** `https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_albums&utm_content={{ad.name}}`

`{{ad.name}}` is a Meta URL parameter that fills in the ad’s name, so the registration Sheet shows which ad each ticket came from.

### One ad per brand

`images/brands/` has a square and a portrait ad for each of the 36 brands ("Hear <name>") and the 5 dealers ("Visit <name>") on the site’s 2026 brand wall, named `hea26_brand_<name>_<size>.jpg`. Use them in M1 with ad F’s text, or give them to exhibitors to post.

### Carousels

Two carousel ads for Facebook and Instagram feed, 1080×1080 cards in `images/carousel-show/` and `images/carousel-brands/`. Use them in M1 beside the single images, and in M3 for retargeting. Turn off "automatically show the best performing cards first" so the order is kept: the first card is the hook and the last is the call to register.

#### Carousel 1 · The whole show

- **Primary text:** Singapore’s hi-fi show is back. The big names in dedicated listening rooms, keynote talks, the HiEnd Asia albums and a daily lucky draw. 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.
- **Description on every card:** Tap to get your free ticket
- **Button:** Get Offer
- **Link on every card:** https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_carousel_show&utm_content={{ad.name}}

| Card | Image | Headline |
| --- | --- | --- |
| 1 | `carousel-show/01_show.jpg` | Singapore’s Hi-Fi Show Is Back |
| 2 | `carousel-show/02_brands.jpg` | The Big Names Are Coming |
| 3 | `carousel-show/03_listening-rooms.jpg` | 3 Days of Listening Rooms |
| 4 | `carousel-show/04_keynotes.jpg` | 11 Sessions, 2 Experts |
| 5 | `carousel-show/05_billy-ho.jpg` | EB Duet’s Billy Ho, Live |
| 6 | `carousel-show/06_albums.jpg` | The HiEnd Asia Albums |
| 7 | `carousel-show/07_lucky-draw.jpg` | Register by 5 Dec to Win |
| 8 | `carousel-show/08_register.jpg` | Get Your Free Ticket |

#### Carousel 2 · Brand by brand

- **Primary text:** The big names in hi-fi are coming to HiEnd Asia. Hear them in dedicated listening rooms, 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.
- **Description on every card:** Tap to get your free ticket
- **Button:** Get Offer
- **Link on every card:** https://www.hiendasia.com/register.html?utm_source=meta&utm_medium=paid_social&utm_campaign=hea26_carousel_brands&utm_content={{ad.name}}

| Card | Image | Headline |
| --- | --- | --- |
| 1 | `carousel-brands/01_audio-technica.jpg` | Hear Audio-Technica |
| 2 | `carousel-brands/02_accuphase.jpg` | Hear Accuphase |
| 3 | `carousel-brands/03_wilson-audio.jpg` | Hear Wilson Audio |
| 4 | `carousel-brands/04_pass-labs.jpg` | Hear Pass Labs |
| 5 | `carousel-brands/05_clearaudio.jpg` | Hear Clearaudio |
| 6 | `carousel-brands/06_tad.jpg` | Hear TAD |
| 7 | `carousel-brands/07_register.jpg` | Get Your Free Ticket |

## Google

Account: **HIEND ASIA + PTE. LTD.**, 545-469-1642 (SGD, auto-tagging on). I can read it but not change it, so these are built by hand in Google Ads.

What the account showed on 28 Nov 2026:

- Four campaigns from 2025, all paused: `ChenLei2025 - Search` (S$905 spent), `HEA_GDN_SE-Asia_B2C` (S$296), `HEA_Search_SG_B2C` (S$283) and `chenlei025 - pmax` (S$6). Leave them paused and build new ones; between them they recorded one conversion.
- No conversion measures a registration. The enabled ones are `Page view (1)`, `OUTBOUND_CLICK` and an Android installs default. Import the GA4 `sign_up` key event, make it the only primary conversion and set the others to secondary, or Maximise conversions will chase page views.
- In `HEA_Search_SG_B2C`, `high end audio singapore` brought 605 clicks at S$0.09 with a 28% click-through rate, and the four spellings of the show name brought 424 clicks. `sound speaker` on broad match took S$128 for 597 clicks at an 8% click-through rate: do not reuse it, and use phrase or exact match only.

### G1 Search

- **Network:** Google Search only, no search partners, no Display.
- **Location:** Singapore, presence only. **Language:** English.
- **Bidding:** Maximise clicks with a S$0.60 bid cap to start (clicks cost S$0.09 to S$0.37 in 2025); switch to Maximise conversions once `sign_up` has 15 or more conversions.
- **Why so small:** "hifi show singapore" gets about 20 searches a month and the site already ranks first or second for it.

**Brand (always on):** `[hiend asia]`, `[hi end asia]`, `[high end asia]`, `[hiendasia]`, `"hiend asia 2026"`, `"hi end asia 2026"`, `"hiend asia singapore"`

**The show (always on):** `"hifi show singapore"`, `"singapore hifi show"`, `"audio show singapore"`, `"singapore audio show 2026"`, `"hifi show 2026"`, `"hifi exhibition"`, `"high end audio show"`, `"high end audio singapore"`

**What’s on (14 to 19 Dec only):** `"suntec events"`, `"suntec convention centre events"`, `"things to do in singapore this weekend"`, `"art exhibition singapore"`, `"events in singapore this weekend"`

**Negative keywords:** `jobs`, `career`, `hiring`, `rental`, `repair`, `second hand`, `used`, `cheap`, `wedding`, `car audio`, `exhibitor booth price`, `concert`, `chen lei`, `陈雷`

**Responsive search ad, headlines (30 max):**

1. HiEnd Asia 2026 Singapore (25)
2. Singapore Hi-Fi Show 2026 (25)
3. 17–19 Dec at Suntec (19)
4. Free Entry. Register Now (24)
5. Get Your Free Ticket (20)
6. The Big Names in Hi-Fi (22)
7. Listening Rooms on Level 3 (26)
8. Audio Visual & Art Exhibition (29)
9. Keynote Talks All 3 Days (24)
10. Daily Lucky Draw at the Show (28)
11. Register by 5 Dec for the Draw (30)
12. Hear the Gear Before You Buy (28)
13. Vinyl, Turntables, Speakers (27)
14. Official Site. Free Tickets (27)
15. Suntec Convention Centre (24)

Pin headline 1 or 2 to position 1. Pause headlines 10 and 11 after 5 Dec.

**Descriptions (90 max):**

1. Singapore’s hi-fi show returns to Suntec, 17–19 Dec 2026. Entry is free with a ticket. (86)
2. The big names in hi-fi in dedicated listening rooms, plus NOWASIA art galleries on Level 3 (90)
3. Register once and enter on any of the three days. Your ticket is sent by email. (79)
4. Keynote talks, live music and a daily lucky draw for registered visitors. 10am–7pm. (83)

**Final URL:** `https://www.hiendasia.com/register.html?utm_source=google&utm_medium=cpc&utm_campaign=hea26_search&utm_content={adgroupid}`

**Sitelinks:**

| Text | Description | URL |
| --- | --- | --- |
| Register Free | One ticket covers all three days | `https://www.hiendasia.com/register.html` |
| Show Floorplan | Find every listening room | `https://www.hiendasia.com/#floorplan` |
| Keynote Speakers | Eleven sessions, two experts | `https://www.hiendasia.com/#speakers` |
| Getting There | Level 3, Suntec Singapore | `https://www.hiendasia.com/#visit` |

**Callouts:** Free Entry · 17–19 Dec 2026 · 10am–7pm Daily · Level 3, Suntec · Top Hi-Fi Brands · Art Galleries Too

### G2 Demand Gen

- **Goal:** conversions (`sign_up`). **Location:** Singapore.
- **Formats:** one video ad (the showcase video, uploaded to the HiEnd Asia YouTube channel) and one image ad per concept.
- **Images:** landscape, square and portrait of A (to 5 Dec), B, C and D, plus the square logo.
- **Button:** Sign up. **Business name:** HiEnd Asia.

| Ad group | Audience |
| --- | --- |
| Hi-fi searchers | Custom segment: people who searched for hi-fi show, turntable, vinyl records, bookshelf speakers, amplifier, home theatre system |
| In-market audio | In-market: Home audio, Speakers, Headphones; affinity: Audiophiles, Music lovers |
| Art and culture | Affinity: Art and theatre aficionados; in-market: Event tickets |

**Headlines (40 max):**

1. Singapore’s Hi-Fi Show, 17–19 Dec (33)
2. Free Entry to HiEnd Asia 2026 (29)
3. The Big Names in Hi-Fi at Suntec (32)
4. Register by 5 Dec for the Lucky Draw (36)
5. Three Days of Listening Rooms (29)

**Descriptions (90 max):**

1. Singapore’s hi-fi show returns to Suntec, 17–19 Dec 2026. Entry is free with a ticket. (86)
2. The big names in hi-fi in dedicated listening rooms, plus NOWASIA art galleries on Level 3 (90)
3. Register once and enter on any of the three days. Your ticket is sent by email. (79)
4. Keynote talks, live music and a daily lucky draw for registered visitors. 10am–7pm. (83)
5. Hear turntables, speakers and amplifiers in purpose-built rooms. Free with a ticket. (84)

**Final URL:** `https://www.hiendasia.com/register.html?utm_source=google&utm_medium=demand_gen&utm_campaign=hea26_demandgen&utm_content={creative}`

### G3 Demand Gen remarketing

Built and paused on 28 Nov 2026, running 9 to 18 Dec at S$70. Google Ads sees 0 eligible people in the GA4 visitor list and rules it too small for Demand Gen, so it will not serve unless the list grows. The live ad uses headlines 2 to 4 and descriptions 2 and 3 below; the lucky draw lines are left out because it starts after 5 Dec.

- **Audience:** GA4 audience "visited, did not register" (page view in the last 30 days, no `sign_up`).
- **Images:** A to 5 Dec, then C and D to 11 Dec, then B and D to 16 Dec; E on 17–18 Dec with the show page as the link.
- **Copy:** the same three messages as M3, in the same order. Swap the headlines and descriptions on 6 and 12 Dec.
- **Note:** this list only fills from visitors who accept cookies, so it will be small. Keep the budget at S$70; if it cannot spend, move what is left to G1.

**Headlines (40 max):** 1 is for R1 only (to 5 Dec), 2 for R2, 3 for R3; 4 runs throughout.

1. Register by 5 Dec. Daily Lucky Draw (35)
2. Your Free Ticket Is Still Waiting (33)
3. Opens 17 Dec. Get Your Free Ticket (34)
4. Claim Your Free Ticket in a Minute (34)

**Descriptions (90 max):** 1 is for R1 only, 2 for R2, 3 for R3.

1. Your free HiEnd Asia ticket takes a minute. Register by 5 Dec for the daily lucky draw. (87)
2. Three days of listening rooms and art at Suntec, 17–19 Dec. Free with a ticket. (79)
3. HiEnd Asia opens 17 Dec on Level 3, Suntec. Register now; your ticket is free. (78)

**Final URL:** `https://www.hiendasia.com/register.html?utm_source=google&utm_medium=demand_gen&utm_campaign=hea26_remarketing&utm_content={creative}`

## Changes on fixed dates

| Date | Change |
| --- | --- |
| 5 Dec, 11:59pm | Stop every A (lucky draw) ad; pause RSA headlines 10 and 11 |
| 6 Dec | Start C and D ads; retargeting moves from R1 to R2 (Meta switches itself; swap the G3 text by hand) |
| 12 Dec | Retargeting moves from R2 to R3 (Meta switches itself; swap the G3 text by hand) |
| 14 Dec | Start the "What’s on" search ad group; stop M2 |
| 16 Dec, 6pm | Start M4 show-days ads |
| 17 Dec | Stop M1, M3 and G2; registrations still open, but spend moves to walk-ins |
| 19 Dec, 5pm | Stop everything |

## Before launch

- Mark `sign_up` as a key event in GA4 and import it into Google Ads.
- In Google Ads account 545-469-1642, check the link to the GA4 property "hiendasia.com" and make `sign_up` the only primary conversion.
- Upload the showcase video to YouTube (needed for G2).
- Confirm Richard H. Mak’s sessions; the site still marks his topic as proposed.
- Have someone at HiEnd Asia approve the keynote portraits for advertising use.
