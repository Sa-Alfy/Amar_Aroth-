---
name: bangla-copy
description: "Use whenever writing text a user of Amar Aroth will read — button labels, headings, placeholders, empty states, validation messages, toasts, and the error strings returned from route handlers under app/api/. Triggers on: error message, label, placeholder, copy, wording, toast, validation message, or any new user-facing string."
---

# User-facing copy — Amar Aroth

The audience is Bangladeshi farmers, আড়তদার, and দোকানদার. Many are on a cheap Android phone
on mobile data, and many are not comfortable readers of English. **Every string a user can
see is in Bangla.** English stays in code: identifiers, comments, log lines, commit messages.

## The rule that gets broken most

Route handlers must not leak raw errors. This is wrong:

```ts
return NextResponse.json({ success: false, error: listingError?.message || 'Failed to create listing' }, { status: 400 });
```

A farmer should never see `duplicate key value violates unique constraint`. Log the real
error, return a Bangla one:

```ts
console.error('[api/listings] insert failed:', listingError);
return NextResponse.json({ success: false, error: 'লিস্টিং তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, { status: 400 });
```

The same applies to `catch` blocks, fallback strings after `||`, `alert()`, and anything
passed to a toast.

## Tone

Plain, direct, respectful. Address the user as আপনি. Say what went wrong and what to do next,
in that order. No blame, no jargon, no apology paragraphs.

Match the existing voice in `app/api/auth/*/route.ts` and `app/signup/page.tsx`:

| Situation | Existing string |
|---|---|
| Bad phone | সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন |
| Short name | আপনার পুরো নাম লিখুন (কমপক্ষে ৩ অক্ষর) |
| Short PIN | পাসওয়ার্ড বা পিন কমপক্ষে ৬ অক্ষরের হতে হবে |
| Mismatched PIN | পাসওয়ার্ড দুটি মিলছে না। আবার লিখুন। |
| Wrong credentials | ফোন নম্বর বা পাসওয়ার্ড সঠিক নয় |
| Duplicate account | এই ফোন নম্বরে ইতিমধ্যে একাউন্ট আছে |
| Rate limited | অল্প সময়ের মধ্যে অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন। |
| Network failure | নেটওয়ার্ক সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন। |
| Server fault | সার্ভার ত্রুটি হয়েছে |

Reuse an existing string when the situation matches. Do not invent a second phrasing for the
same failure.

## Domain vocabulary

Use the trade's own words, not translations of English product terms:

- কৃষক (farmer), আড়তদার (arathdar), দোকানদার (dokandar)
- আড়তদার toggle: কিনছি / বেচছি
- Feed labels are built from `trade_permissions` on the server and returned in the `feeds`
  array — take the Bangla label from there rather than hardcoding one in a component.

## Numerals

Bengali numerals (১২৩) in prose and in validation messages, matching the existing strings
above. Western numerals are fine for prices, quantities, and phone numbers the user typed,
since those come from data rather than copy — but be consistent within one screen.

## Practical constraints

- Bangla renders longer than English. Check that buttons and tabs do not overflow at 360px
  width before calling a UI change done.
- Fonts are self-hosted in `public/fonts/` (Anek, Bengali and Latin subsets). Do not add a
  webfont link or a new font family; use the existing stack.
- Do not add an i18n library or a translations file. The app is Bangla-first, single-locale,
  and strings live inline.

## Checklist before finishing

1. Every new string a user can read is Bangla.
2. No raw Supabase or JS error text reaches the response body.
3. Existing phrasing reused where the situation already has one.
4. Nothing overflows at 360px.
