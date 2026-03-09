# Brownfield Migration Plan — EXTRACTA

**Scan Date:** 2026-02-26
**Total Components Found:** 11
**Components with Stories:** 0
**Migration Gap:** 11 (100%)
**Estimated Total Effort:** 7.5 hours

---

## Executive Summary

EXTRACTA has **11 React components** across 2 main areas:

1. **Main App** (2 components)
   - `Home` (Page, 718 LOC) — large monolithic component
   - `RootLayout` (Template, 18 LOC) — simple wrapper

2. **Health Dashboard** (9 components)
   - 4 shared foundation components
   - 5 UI organisms

**Current State:** 0% of components have Storybook stories.

**Recommendation:** Migrate in 4 phases respecting dependency order.

---

## Phase 1: Foundation & Atoms ⭐ CRITICAL

**Priority:** CRITICAL — foundation for all other components
**Effort:** 30 minutes
**Trigger for Phase 2:** All Phase 1 stories PASS

### StatusBadge
| Attribute | Value |
|-----------|-------|
| **File** | `.aios-core/scripts/diagnostics/health-dashboard/src/components/shared/StatusBadge.jsx` |
| **Type** | Atom |
| **Dependencies** | None |
| **Depended By** | IssuesList, DomainCard, TechDebtList |
| **Complexity** | ⭐ (1/10) |
| **Lines of Code** | 18 |
| **Variants** | 4 (success, warning, error, info) |

**Story Plan:**
- `Default` — primary variant
- `Success` — success state
- `Warning` — warning state
- `Error` — error state
- `Info` — info state
- `AllVariants` — gallery of all 4 variants side-by-side

**Testing:**
- Visual regression: Chromatic snapshots for each variant
- A11y: addon-a11y WCAG validation
- Interaction: verify status prop changes appearance

---

## Phase 2: Base Molecules

**Priority:** HIGH — foundational, enables Phase 3
**Effort:** 2 hours
**Depends On:** Phase 1 PASS
**Trigger for Phase 3:** All Phase 2 stories PASS

### Card
| Attribute | Value |
|-----------|-------|
| **File** | `.aios-core/scripts/diagnostics/health-dashboard/src/components/shared/Card.jsx` |
| **Type** | Molecule |
| **Dependencies** | None |
| **Depended By** | IssuesList, HealthScore, DomainCard, TechDebtList, AutoFixLog (5 components) |
| **Complexity** | ⭐⭐ (2/10) |
| **Lines of Code** | 28 |

**Story Plan:**
- `Default` — basic card
- `WithTitle` — card with title
- `WithIcon` — card with icon variant
- `AllVariants` — gallery

**Notes:** Foundation component, high reuse.

### Header
| Attribute | Value |
|-----------|-------|
| **File** | `.aios-core/scripts/diagnostics/health-dashboard/src/components/shared/Header.jsx` |
| **Type** | Molecule |
| **Dependencies** | None |
| **Complexity** | ⭐⭐ (2/10) |
| **Lines of Code** | 24 |

**Story Plan:**
- `Default` — basic header
- `WithSubtitle` — header + subtitle

### Chart
| Attribute | Value |
|-----------|-------|
| **File** | `.aios-core/scripts/diagnostics/health-dashboard/src/components/shared/Chart.jsx` |
| **Type** | Organism (data viz) |
| **Dependencies** | None (external: recharts or similar) |
| **Depended By** | HealthScore |
| **Complexity** | ⭐⭐⭐⭐ (4/10) |
| **Lines of Code** | 68 |

**Story Plan:**
- `Default` — basic chart with sample data
- `LineChart` — line chart variant
- `BarChart` — bar chart variant
- `WithAnimation` — animated chart
- `Responsive` — responsive sizing

**Testing:**
- Play functions to test data updates
- Interaction testing for tooltips/hover

---

## Phase 3: Dashboard UI Organisms

**Priority:** HIGH — core dashboard components
**Effort:** 3 hours
**Depends On:** Phase 2 PASS (Card, StatusBadge, Chart)
**Trigger for Phase 4:** All Phase 3 stories PASS

### IssuesList
| Attribute | Value |
|-----------|-------|
| **File** | `.aios-core/scripts/diagnostics/health-dashboard/src/components/IssuesList.jsx` |
| **Type** | Organism |
| **Dependencies** | Card, StatusBadge |
| **Depended By** | (none yet) |
| **Complexity** | ⭐⭐⭐ (3/10) |
| **Lines of Code** | 52 |

**Story Plan:**
- `Default` — basic issues list
- `Empty` — empty state
- `WithFilter` — with filtering
- `Loading` — loading state

### HealthScore
| Attribute | Value |
|-----------|-------|
| **File** | `.aios-core/scripts/diagnostics/health-dashboard/src/components/HealthScore.jsx` |
| **Type** | Organism |
| **Dependencies** | Card, Chart |
| **Complexity** | ⭐⭐⭐⭐ (4/10) |
| **Lines of Code** | 56 |

**Story Plan:**
- `Default` — health score with chart
- `High` — high score (70+)
- `Medium` — medium score (40-70)
- `Low` — low score (<40)
- `WithBreakdown` — detailed breakdown

### DomainCard
| Attribute | Value |
|-----------|-------|
| **File** | `.aios-core/scripts/diagnostics/health-dashboard/src/components/DomainCard.jsx` |
| **Type** | Organism |
| **Dependencies** | Card, StatusBadge |
| **Complexity** | ⭐⭐⭐ (3/10) |
| **Lines of Code** | 42 |

**Story Plan:**
- `Default` — basic domain card
- `Healthy` — healthy status
- `AtRisk` — at-risk status
- `Critical` — critical status
- `Interactive` — with onClick handler

### TechDebtList
| Attribute | Value |
|-----------|-------|
| **File** | `.aios-core/scripts/diagnostics/health-dashboard/src/components/TechDebtList.jsx` |
| **Type** | Organism |
| **Dependencies** | Card, StatusBadge |
| **Complexity** | ⭐⭐⭐ (3/10) |
| **Lines of Code** | 48 |

**Story Plan:**
- `Default` — tech debt list
- `Empty` — empty state
- `WithDismiss` — dismissible items
- `Grouped` — grouped by category

### AutoFixLog
| Attribute | Value |
|-----------|-------|
| **File** | `.aios-core/scripts/diagnostics/health-dashboard/src/components/AutoFixLog.jsx` |
| **Type** | Organism |
| **Dependencies** | Card |
| **Complexity** | ⭐⭐⭐ (3/10) |
| **Lines of Code** | 44 |

**Story Plan:**
- `Default` — auto-fix log
- `InProgress` — in-progress state
- `Success` — success logs
- `Error` — error logs
- `AllStages` — all progress stages

---

## Phase 4: Layout & Pages

**Priority:** MEDIUM — top-level layout/pages
**Effort:** 2 hours
**Depends On:** Phase 3 PASS (optional - these can be independent)

### RootLayout
| Attribute | Value |
|-----------|-------|
| **File** | `web/app/layout.tsx` |
| **Type** | Template |
| **Dependencies** | None |
| **Complexity** | ⭐ (1/10) |
| **Lines of Code** | 18 |

**Story Plan:**
- `Default` — basic layout wrapper
- `WithContent` — with sample content

**Notes:** Simple wrapper, quick story.

### Home
| Attribute | Value |
|-----------|-------|
| **File** | `web/app/page.tsx` |
| **Type** | Page |
| **Dependencies** | RootLayout |
| **Complexity** | ⭐⭐⭐⭐⭐⭐⭐⭐ (8/10) |
| **Lines of Code** | 718 |
| **Nested Components** | 4 inline components |

**⚠️ REFACTORING RECOMMENDED BEFORE STORYBOOK:**

The `Home` component is a **large monolith (718 LOC)**. It contains:

1. **Logo** — Nested component (should extract)
2. **FlagButton** — Nested component (should extract)
3. **UploadIcon** — Nested component (should extract)
4. **FileIcon** — Nested component (should extract)
5. **Main processing logic** — States, handlers, rendering

**Recommendation:**
```
BEFORE Storybook migration, extract 4 nested components:
  ✅ web/components/Logo.tsx
  ✅ web/components/FlagButton.tsx
  ✅ web/components/UploadIcon.tsx
  ✅ web/components/FileIcon.tsx

Then break Home into:
  ✅ web/components/UploadZone.tsx
  ✅ web/components/PresetSelector.tsx
  ✅ web/components/ProcessButton.tsx
  ✅ web/components/PipelineProgress.tsx
  ✅ web/components/ResultsDisplay.tsx
  ✅ web/app/page.tsx (orchestrator)
```

**Effort:** 2-3 hours refactoring + 3 hours stories = 5-6 hours total

**Story Plan (after refactoring):**
- `Default` — full page
- `WithFile` — file uploaded
- `Processing` — processing state
- `WithResults` — results shown
- `Error` — error state
- `Mobile` — responsive layout

---

## Dependency Graph

```
┌─────────────────────────────────────────────────┐
│           Phase 1: Atoms (FOUNDATION)           │
├─────────────────────────────────────────────────┤
│  StatusBadge (no deps)                          │
└────────────┬────────────────────────────────────┘
             │
             ├──────────────────────────────────────┐
             │                                      │
     ┌───────▼────────────────────────────────────┐ │
     │    Phase 2: Molecules (FOUNDATION)        │ │
     ├────────────────────────────────────────────┤ │
     │  Card (no deps) ✓                         │ │
     │  Header (no deps) ✓                       │ │
     │  Chart (no deps) ✓                        │ │
     └───────┬────────────────────────────────────┘ │
             │                                      │
             └──────────────┬───────────────────────┘
                            │
     ┌──────────────────────▼────────────────────┐
     │  Phase 3: Organisms (UI Composition)     │
     ├────────────────────────────────────────────┤
     │  IssuesList (Card, StatusBadge)           │
     │  HealthScore (Card, Chart)                │
     │  DomainCard (Card, StatusBadge)           │
     │  TechDebtList (Card, StatusBadge)         │
     │  AutoFixLog (Card)                        │
     └────────────┬─────────────────────────────┘
                  │
     ┌────────────▼──────────────────────────────┐
     │  Phase 4: Layout & Pages (Optional)      │
     ├────────────────────────────────────────────┤
     │  RootLayout (no deps)                    │
     │  Home (RootLayout)                       │
     └────────────────────────────────────────────┘
```

---

## Timeline & Effort Estimate

| Phase | Components | Effort | Total | Status |
|-------|-----------|--------|-------|--------|
| 1 | 1 atom | 0.5h | 0.5h | Ready |
| 2 | 3 molecules | 2h | 2.5h | Ready |
| 3 | 5 organisms | 3h | 5.5h | Ready |
| 4a | Home refactor | 2-3h | 7.5-8.5h | Recommended |
| 4b | 2 pages/layouts | 2h | 9.5-10.5h | After 4a |
| **TOTAL** | **11** | **7.5-10.5h** | | **READY** |

---

## Next Steps

**To begin migration:**

```
*migrate --phase=1
```

This will:
1. Create Phase 1 stories (StatusBadge)
2. Run CSF3 linting
3. Configure Chromatic for visual regression
4. Generate gallery stories

---

**Notes:**
- All components use JSX/TSX
- Health Dashboard components are well-isolated
- Main app (Home) needs decomposition before stories
- No circular dependencies detected
- Recommended start: Phase 1 (30 mins, high confidence)

---

*Migration Plan v1.0 | Generated: 2026-02-26*
