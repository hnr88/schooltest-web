# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task34-captures.spec.ts >> ops/34 — the four migrated surfaces, 1440x900 captures >> captures past sessions, students results, progress watch and the live monitor
- Location: tests/e2e/task34-captures.spec.ts:111:5

# Error details

```
Test timeout of 240000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - complementary [ref=e3]:
      - link "SchoolTest" [ref=e4] [cursor=pointer]:
        - /url: /
        - img "SchoolTest" [ref=e5]
      - generic [ref=e6]:
        - paragraph [ref=e7]: Every test, one dashboard.
        - paragraph [ref=e8]: Sign in to follow your students' tests, scores, and AI feedback in one place.
        - list [ref=e9]:
          - listitem [ref=e10]:
            - img [ref=e12]
            - text: Track every assigned test and deadline
          - listitem [ref=e14]:
            - img [ref=e16]
            - text: See scores the moment they're graded
          - listitem [ref=e18]:
            - img [ref=e20]
            - text: Understand progress with AI feedback
      - paragraph [ref=e22]: © 2026 SchoolTest. All rights reserved.
    - generic [ref=e25]:
      - generic [ref=e26]:
        - heading "Sign in to SchoolTest" [level=1] [ref=e27]
        - paragraph [ref=e28]: Access your account to manage your students and their tests.
      - link "Continue with Google" [ref=e29] [cursor=pointer]:
        - /url: http://localhost:5500/api/connect/google
        - img
        - text: Continue with Google
      - generic [ref=e30]:
        - separator [ref=e31]
        - generic [ref=e32]: or
        - separator [ref=e33]
      - generic [ref=e34]:
        - alert [ref=e35]:
          - img [ref=e37]
          - paragraph [ref=e40]: You appear to be offline. Check your connection and try again.
        - generic [ref=e41]:
          - generic [ref=e42]: Email
          - textbox "Email" [ref=e43]:
            - /placeholder: you@example.com
            - text: t2@schooltest.local
        - generic [ref=e44]:
          - generic [ref=e45]:
            - generic [ref=e46]: Password
            - link "Forgot password?" [ref=e47] [cursor=pointer]:
              - /url: /forgot-password
          - generic [ref=e48]:
            - textbox "Password" [ref=e49]:
              - /placeholder: Enter your password
              - text: Teacher1234!
            - button "Show password" [ref=e50]:
              - img
        - button "Sign in" [ref=e51]
      - paragraph [ref=e52]:
        - text: Don't have an account?
        - link "Sign up" [ref=e53] [cursor=pointer]:
          - /url: /sign-up
  - generic [ref=e54]:
    - img [ref=e56]
    - button "Open Tanstack query devtools" [ref=e104] [cursor=pointer]:
      - img [ref=e105]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e158] [cursor=pointer]:
    - img [ref=e159]
  - alert [ref=e162]
```