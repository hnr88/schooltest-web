# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journey-04-teacher-assign-test.spec.ts >> assign a test to a class, open the sitting, and it all persists on reload
- Location: tests/e2e/journey-04-teacher-assign-test.spec.ts:65:5

# Error details

```
Test timeout of 240000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - link "SchoolTest" [ref=e7] [cursor=pointer]:
        - /url: /dashboard
        - img "SchoolTest" [ref=e8]
      - navigation [ref=e10]
      - button "Open user menu" [ref=e12]:
        - generic [ref=e13]: P
        - generic [ref=e14]:
          - generic [ref=e15]: parent
          - generic [ref=e16]: Parent account
    - main [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - button "Toggle navigation" [ref=e20]:
            - img
            - generic [ref=e21]: Toggle Sidebar
          - navigation "Breadcrumb" [ref=e22]:
            - list [ref=e23]:
              - listitem [ref=e24]:
                - link "Dashboard" [disabled] [ref=e25]
          - button "Open notifications" [ref=e27]:
            - img [ref=e28]
            - generic "1 unread notification" [ref=e31]: "1"
        - main [ref=e33]:
          - generic [ref=e34]:
            - img [ref=e36]
            - paragraph [ref=e39]: Not part of this release
            - paragraph [ref=e40]: The parent portal is not available in this release of SchoolTest. Your account is unchanged, and the portal will be back in a future update.
  - generic [ref=e41]:
    - img [ref=e43]
    - button "Open Tanstack query devtools" [ref=e91] [cursor=pointer]:
      - img [ref=e92]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e145] [cursor=pointer]:
    - img [ref=e146]
  - alert [ref=e149]: Your students — SchoolTest · SchoolTest
```