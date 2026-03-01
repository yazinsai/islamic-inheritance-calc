# Islamic Inheritance Calculator

Most Islamic inheritance calculators throw every possible heir at you in one big form, whether they're relevant or not. You end up staring at 20+ fields, unsure which ones matter. This one takes the opposite approach — it only asks what it needs to.

The form adapts as you go. If the deceased has sons, you won't be asked about grandsons (they're blocked by Islamic law). If there's a father, the siblings section disappears entirely (Hanafi school). Fields appear and vanish based on the actual rules of faraid, so you're never guessing which inputs matter and which don't.

The goal is that anyone — not just someone who studied inheritance law — can use this and get a correct answer.

![Screenshot](docs/screenshot.png)

## How it works

1. Select the deceased's gender
2. Enter which heirs are alive (spouse, children, parents, siblings, etc.)
3. Optionally enter the estate value
4. Get the exact fractional shares for each heir, with plain-language explanations

## What it handles

- All 22 heir types in Islamic inheritance law
- Blocking rules (hajb) - who excludes whom
- Awl (proportional reduction when shares exceed the estate)
- Radd (redistribution when shares don't fill the estate)
- Umariyyah, Mushtaraka, and Akdariyyah special cases
- Grandfather-with-siblings scenarios
- 7 languages: English, Arabic, Urdu, Turkish, Malay, Indonesian, French

## Correctness

Verified against **133 test cases** from [ilmsummit.org](http://inheritance.ilmsummit.org), a widely-referenced scholarly resource. All pass.

The test cases were scraped using `scripts/fetch-test-cases.py`, which fetches each case from ilmsummit.org and extracts the expected shares and calculation steps. The scraped data lives in `test-cases.json` and drives the test suite.

```bash
# Re-fetch test cases from ilmsummit.org
python3 scripts/fetch-test-cases.py

# Run the test suite
npm test
```

## Tech stack

- Next.js, TypeScript, Tailwind CSS
- [fraction.js](https://github.com/rawify/Fraction.js) for exact rational arithmetic (no floating-point rounding)
- Client-side only - no server, no database

## Running locally

```bash
npm install
npm run dev
```

## Live

https://inheritance-calc.whhite.com
