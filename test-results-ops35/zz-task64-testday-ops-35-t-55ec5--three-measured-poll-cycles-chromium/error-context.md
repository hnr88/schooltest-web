# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zz-task64-testday.spec.ts >> ops/35: test-day monitor kit adoption — the view survives the sitting polls >> filter, sort, page and scroll survive three measured poll cycles
- Location: tests/e2e/zz-task64-testday.spec.ts:369:7

# Error details

```
Test timeout of 240000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - complementary [ref=e3]:
      - link "SchoolTest" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "SchoolTest" [ref=e6]
      - generic [ref=e7]:
        - generic [ref=e8]: School portal
        - paragraph [ref=e9]: English language diagnostic and progress testing, aligned to ACARA
        - generic [ref=e10]:
          - generic [ref=e11]:
            - term [ref=e12]: Subskills
            - definition [ref=e13]: "25"
          - generic [ref=e14]:
            - term [ref=e15]: Year levels
            - definition [ref=e16]: 7 to 12
          - generic [ref=e17]:
            - term [ref=e18]: Reported on
            - definition [ref=e19]: ACARA
        - paragraph [ref=e20]: SchoolTest acknowledges the Traditional Custodians of the lands on which Australian schools stand.
    - generic [ref=e22]:
      - navigation "Breadcrumb" [ref=e23]:
        - link "Home" [ref=e24] [cursor=pointer]:
          - /url: /
        - text: /Portal access
      - generic [ref=e25]:
        - generic [ref=e26]:
          - heading "Log in to the portal" [level=1] [ref=e27]
          - paragraph [ref=e28]: Use the account your school administrator issued.
        - generic [ref=e29]:
          - generic [ref=e30]:
            - generic [ref=e31]: Email address
            - textbox "Email address" [ref=e32]:
              - /placeholder: name@school.edu.au
          - generic [ref=e33]:
            - generic [ref=e34]:
              - generic [ref=e35]: Password
              - link "Forgot password" [ref=e36] [cursor=pointer]:
                - /url: /forgot-password
            - textbox "Password" [ref=e38]:
              - /placeholder: Enter your password
          - button "Log in" [ref=e39]
        - paragraph [ref=e40]: Portal accounts are issued by invitation. Ask your school's EAL/D coordinator to invite you.
      - generic [ref=e41]:
        - link "Privacy statement" [ref=e42] [cursor=pointer]:
          - /url: /privacy-policy
        - link "Accessibility" [ref=e43] [cursor=pointer]:
          - /url: /
        - generic [ref=e44]: © 2026 SchoolTest
  - generic [ref=e45]:
    - img [ref=e47]
    - button "Open Tanstack query devtools" [ref=e95] [cursor=pointer]:
      - img [ref=e96]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e149] [cursor=pointer]:
    - img [ref=e150]
  - alert [ref=e153]: Sign in — SchoolTest · SchoolTest
```