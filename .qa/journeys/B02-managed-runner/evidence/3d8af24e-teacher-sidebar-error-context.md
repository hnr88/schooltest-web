# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: teacher-sidebar.spec.ts >> teacher rail scoping (A4) >> a teacher sees exactly Classes then Live sessions under the TEACHER VIEW overline
- Location: tests/e2e/teacher-sidebar.spec.ts:94:7

# Error details

```
Test timeout of 30000ms exceeded.
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
        - main [ref=e32]:
          - generic [ref=e33]:
            - img [ref=e35]
            - paragraph [ref=e38]: Not part of this release
            - paragraph [ref=e39]: The parent portal is not available in this release of SchoolTest. Your account is unchanged, and the portal will be back in a future update.
  - generic [ref=e40]:
    - img [ref=e42]
    - button "Open Tanstack query devtools" [ref=e90] [cursor=pointer]:
      - img [ref=e91]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e144] [cursor=pointer]:
    - img [ref=e145]
  - alert [ref=e148]: Your students — SchoolTest · SchoolTest
```