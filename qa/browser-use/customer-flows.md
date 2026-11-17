# Customer website functional QA

Use Browser Use to interact with http://127.0.0.1:3101 only. The website talks to
the isolated synthetic API at http://127.0.0.1:18080. Use the project QA Chrome
profile, not the user's personal browser. Do not use Strix or its saved prompts.
This plan checks intended product behavior, not security exploitation.

For each scenario record expected result, observed result, pass/fail/blocked,
and an error description. Completion of clicks alone is not a passed assertion.
Distinguish actual browser actions from API fixture preparation.

1. Open /login. Check the Persian form is readable and controls are reachable.
2. Submit an empty/invalid phone number. Expect a useful validation message and
   no progression to the OTP screen. Do not guess passwords or OTPs.
3. Enter the synthetic lab phone 09100000001 and request an OTP. Expect the
   six-digit input. Read the code from the local lab's `/__lab/sms` simulator
   (fixture access, not a real SMS service). Enter that code through the UI.
4. Expect successful login and a dashboard with navigation. Check the displayed
   customer state against the lab fixture. Report unavailable market data; the
   exchange engine is not running, so do not claim trading execution was tested.
5. Open /wallet using visible navigation. Check loading/error/empty states are
   understandable and supported synthetic balances load. Never use real funds.
6. Open the BTC deposit dialog. Request an address through the UI and compare it
   with the same customer's address in the fixture API. Reopening should show the
   same address. Do not transfer coins or use the public test seed for funds.
7. If the payment UI is available, create a synthetic minimum deposit using the
   local simulator only. The `lab.invalid` checkout URL is a placeholder: do not
   navigate to it. Use the simulator to mark settlement, then check the visible
   status/balance after refresh. Record this simulation step explicitly.
8. Inspect settings and bank destinations without adding real personal details.
   Check required-field messages and cancel behavior. Use fixture data only.
9. Log out using the visible UI. Expect the login screen and a signed-out state.
10. Repeat navigation and login-form checks in a narrow viewport; check clipping,
    horizontal scrolling and controls obscured by the keyboard/modal layout.

Stop and report infrastructure errors or provider refusals. Do not retry a
blocked cybersecurity task through this workflow, change providers to evade a
block, or reinterpret an API error as a passed user journey. No real payment,
withdrawal, order, payout, or blockchain broadcast is authorized by this plan.
