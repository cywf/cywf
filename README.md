# 🧠 Welcome to my Cyber Space

**A living dashboard for my public open-source projects, automations, and analytics.**

<details>
<summary><b>📊 System Overview</b></summary>

A public-repo-only snapshot of the cywf ecosystem: what is active, what needs attention, and how the projects cluster together.

<!-- START: SYSTEM_OVERVIEW -->
| Metric | Status |
|--------|--------|
| Public repos tracked | 13 |
| Working repos | 4 |
| Semi-functioning repos | 9 |
| Broken repos | 0 |
| Repos with substantive public CI | 10 |
| Open blocker issues | 1 |
| Queued board tasks | 0 |
| Data freshness mode | 13/13 live GitHub reads; 0 snapshot/seed fallbacks |
| Next-Tasks source | Live Projects v2 data when PROJECTS_TOKEN is available; local runs without it show an explicit degraded state. |
| Primary language mix | Astro, JavaScript, Python, Rust, Shell, TypeScript |
| Portfolio themes | Cybersecurity & Defense • Developer Tooling & Automation • General Software Projects • Infrastructure & Networking • Mapping, Mobility & Aviation • Web Platforms & Content |
| Last ecosystem refresh | 2026-07-07 11:16 UTC |
<!-- END: SYSTEM_OVERVIEW -->

<!-- START: REPO_MERMAID -->
<details>
<summary><b>🗺️ Public Repo Ecosystem Graph</b></summary>

```mermaid
flowchart LR
  root((cywf public repo ecosystem))
  root --> CybersecurityDefense[Cybersecurity & Defense]
  CybersecurityDefense --> FortiPath[🟢 FortiPath]
  CybersecurityDefense --> sentinel-project[🟢 sentinel-project]
  CybersecurityDefense --> AegisNet[🟡 AegisNet]
  CybersecurityDefense --> OTG-TAK[🟡 OTG-TAK]
  CybersecurityDefense --> CTF-Kit[🟡 CTF-Kit]
  root --> InfrastructureNetworking[Infrastructure & Networking]
  InfrastructureNetworking --> InfraGuard[🟡 InfraGuard]
  InfrastructureNetworking --> NetNinja[🟡 NetNinja]
  InfrastructureNetworking --> ZeroTier-Toolkit[🟡 ZeroTier-Toolkit]
  root --> MappingMobilityAviation[Mapping, Mobility & Aviation]
  MappingMobilityAviation --> AirwayAtlas[🟡 AirwayAtlas]
  root --> WebPlatformsContent[Web Platforms & Content]
  WebPlatformsContent --> willow[🟡 willow]
  WebPlatformsContent --> cywf.github.io[🟢 cywf.github.io]
  root --> DeveloperToolingAutomation[Developer Tooling & Automation]
  DeveloperToolingAutomation --> Boilerplates[🟡 Boilerplates]
  root --> GeneralSoftwareProjects[General Software Projects]
  GeneralSoftwareProjects --> AlphaNest[🟢 AlphaNest]
```

### Attention queue
- **ZeroTier-Toolkit** — last push 254 days ago
- **Boilerplates** — last push 254 days ago
- **NetNinja** — last push 252 days ago

</details>
<!-- END: REPO_MERMAID -->

</details>

---

## 📝 Latest Blog Posts

<details>
<summary><b>Click to view recent Daily Di-Gists</b></summary>

These entries are generated from the scheduled public-repo Daily Di-Gist workflow and summarize the last 24 hours of public repo progress, breakages, health, and next steps.

<!-- START: LATEST_POSTS -->
| Date | Title | Summary | Source |
|------|-------|---------|--------|
| 2026-07-07 | Daily Di-Gist — 2026-07-07 | Public repos reviewed: 13. 9 commits observed. 0 workflow failures observed. | [View Digest](daily/2026-07-07.md) |
| 2026-07-06 | Daily Di-Gist — 2026-07-06 | Public repos reviewed: 13. 0 commits observed. 0 workflow failures observed. | [View Digest](daily/2026-07-06.md) |
| 2026-07-05 | Daily Di-Gist — 2026-07-05 | Public repos reviewed: 13. 0 commits observed. 0 workflow failures observed. | [View Digest](daily/2026-07-05.md) |
<!-- END: LATEST_POSTS -->

_This section auto-updates from the Daily Di-Gist workflow._

</details>

---

## 🚀 Project M3trix

<details>
<summary><b>Click to view public repo health by status category</b></summary>

This matrix groups public repositories into working, semi-functioning, and broken buckets based on public workflow visibility, open issue blockages, and recent push activity.

_Next-Tasks cells are rendered from GitHub Projects v2 when `PROJECTS_TOKEN` is available. Local or unauthenticated runs explicitly mark those cells as degraded instead of pretending there are no tasks._

<!-- START: PROJECT_MATRIX -->
| Status | Count | Meaning |
|--------|-------|---------|
| Working | 4 | Public CI present and no obvious portfolio-level blocker signal |
| Semi-functioning | 9 | Stale pushes, missing substantive CI, or disabled workflow signals |
| Broken | 0 | Archived repo or open blocker issue combined with disabled workflow |
<!-- END: PROJECT_MATRIX -->

<details>
<summary><b>🟢 Working repositories (4)</b></summary>

| Project | What it does | Workflow | Status signal | Blockage | Next tasks |
|---------|---------------|----------|---------------|----------|------------|
| **[FortiPath](https://github.com/cywf/FortiPath)** | FortiPath: a comprehensive executive protection tool designed to enha… | ![Workflow](https://github.com/cywf/FortiPath/actions/workflows/deployment_automation.yml/badge.svg?branch=main) | Deployment Automation • 167d since push | [Issue #45](https://github.com/cywf/FortiPath/issues/45) | No queued Project task found |
| **[sentinel-project](https://github.com/cywf/sentinel-project)** | The Sentinel Project is an advanced security system designed to prote… | ![Workflow](https://github.com/cywf/sentinel-project/actions/workflows/ci.yml/badge.svg?branch=main) | CI/CD Pipeline • 172d since push | None | No queued Project task found |
| **[AlphaNest](https://github.com/cywf/AlphaNest)** | The Official AlphaNest Repo | ![Workflow](https://github.com/cywf/AlphaNest/actions/workflows/containers.yml/badge.svg?branch=main) | Build and Test Containers • 162d since push | None | No queued Project task found |
| **[cywf.github.io](https://github.com/cywf/cywf.github.io)** | Welcome to my blog, kindly hosted via github | ![Workflow](https://github.com/cywf/cywf.github.io/actions/workflows/pages.yml/badge.svg?branch=main) | Deploy Astro site to Pages • 0d since push | None | No queued Project task found |

</details>

<details>
<summary><b>🟡 Semi-functioning repositories (9)</b></summary>

| Project | What it does | Workflow | Status signal | Blockage | Next tasks |
|---------|---------------|----------|---------------|----------|------------|
| **[AegisNet](https://github.com/cywf/AegisNet)** | AegisNet: An advanced, integrated defense solution leveraging AI, aut… | ![Workflow](https://github.com/cywf/AegisNet/actions/workflows/docker.yml/badge.svg?branch=main) | Docker Build and Push • 247d since push | None | No queued Project task found |
| **[AirwayAtlas](https://github.com/cywf/AirwayAtlas)** | ✈️ AirwayAtlas: Your go-to resource for airport city data in North Am… | ![Workflow](https://github.com/cywf/AirwayAtlas/actions/workflows/security.yml/badge.svg?branch=main) | .github/workflows/security.yml • 247d since push | None | No queued Project task found |
| **[willow](https://github.com/cywf/willow)** | A Blockchain based Real Estate Website inspired by Zillow. | ![Workflow](https://github.com/cywf/willow/actions/workflows/deploy.yml/badge.svg?branch=main) | Deploy to GitHub Pages • 247d since push | None | No queued Project task found |
| **[OTG-TAK](https://github.com/cywf/otg-tak)** | On-The-Go TAK Deployment | ![Workflow](https://github.com/cywf/OTG-TAK/actions/workflows/test.yml/badge.svg?branch=main) | Test • 247d since push | None | No queued Project task found |
| **[InfraGuard](https://github.com/cywf/Infraguard)** | Repo containing automated server provisioning and configuration scrip… | ![Workflow](https://github.com/cywf/InfraGuard/actions/workflows/terraform-validate.yml/badge.svg?branch=main) | Terraform Validation • 245d since push | None | No queued Project task found |
| **[NetNinja](https://github.com/cywf/netninja)** | Streamline Linux server troubleshooting with NetNinja - the ultimate… | — | No public CI • 252d since push | None | No queued Project task found |
| **[ZeroTier-Toolkit](https://github.com/cywf/zerotier-toolkit)** | 🌐 ZeroTier Toolkit: A powerful suite designed to empower network & s… | — | No public CI • 254d since push | None | No queued Project task found |
| **[Boilerplates](https://github.com/cywf/boilerplates)** | This is my personal template collection. Here you'll find templates,… | — | No public CI • 254d since push | None | No queued Project task found |
| **[CTF-Kit](https://github.com/cywf/ctf-kit)** | A Capture-the-Flag (CTF) Starter Kit | ![Workflow](https://github.com/cywf/CTF-Kit/actions/workflows/validate-contributions.yml/badge.svg?branch=main) | Validate Contributions • 247d since push | None | No queued Project task found |

</details>

<details>
<summary><b>🔴 Broken repositories (0)</b></summary>

_None in this category right now._

</details>

</details>

---

## 📊 Developer Analytics

<details>
<summary><b>Click to view GitHub statistics & activity</b></summary>

<div align="center">

### GitHub Stats

![GitHub Stats](https://github-readme-stats.vercel.app/api?username=cywf&show_icons=true&theme=github_dark&hide_border=true&count_private=true&include_all_commits=true)

### Contribution Streak

![GitHub Streak](https://github-readme-streak-stats.herokuapp.com/?user=cywf&theme=github-dark-blue&hide_border=true)

### Top Languages

![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=cywf&layout=compact&theme=github_dark&hide_border=true&langs_count=8)

### Activity Graph

![Activity Graph](https://github-readme-activity-graph.vercel.app/graph?username=cywf&theme=github-compact&hide_border=true)

### Profile Summary

![Profile Summary](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=cywf&theme=github_dark)

![Stats](https://github-profile-summary-cards.vercel.app/api/cards/stats?username=cywf&theme=github_dark)
![Productive Time](https://github-profile-summary-cards.vercel.app/api/cards/productive-time?username=cywf&theme=github_dark)

</div>

</details>

---

## 🧠 Learning & Interests

<details>
<summary><b>Click to view themes inferred from current public repos</b></summary>

This section is generated strictly from the current public repository portfolio — not from generic interest statements.

<!-- START: LEARNING_DYNAMIC -->
### Focus areas inferred from current public projects

- **Cybersecurity & Defense** — [FortiPath](https://github.com/cywf/FortiPath), [sentinel-project](https://github.com/cywf/sentinel-project), [AegisNet](https://github.com/cywf/AegisNet), [OTG-TAK](https://github.com/cywf/otg-tak), [CTF-Kit](https://github.com/cywf/ctf-kit)
- **Infrastructure & Networking** — [FortiPath](https://github.com/cywf/FortiPath), [sentinel-project](https://github.com/cywf/sentinel-project), [InfraGuard](https://github.com/cywf/Infraguard), [NetNinja](https://github.com/cywf/netninja), [ZeroTier-Toolkit](https://github.com/cywf/zerotier-toolkit)
- **Developer Tooling & Automation** — [sentinel-project](https://github.com/cywf/sentinel-project), [ZeroTier-Toolkit](https://github.com/cywf/zerotier-toolkit), [Boilerplates](https://github.com/cywf/boilerplates)
- **Mapping, Mobility & Aviation** — [AegisNet](https://github.com/cywf/AegisNet), [AirwayAtlas](https://github.com/cywf/AirwayAtlas)
- **Web Platforms & Content** — [willow](https://github.com/cywf/willow), [cywf.github.io](https://github.com/cywf/cywf.github.io)
- **General Software Projects** — [AlphaNest](https://github.com/cywf/AlphaNest)

### Technology mix

- **Languages in active public portfolio:** TypeScript (5), Python (2), JavaScript (2), Astro (2), Rust (1), Shell (1)
- **Projects tracked:** 13

### Recently touched public repos

| Repo | Primary language | Theme | Last public push |
|------|------------------|-------|------------------|
| [cywf.github.io](https://github.com/cywf/cywf.github.io) | TypeScript | Web Platforms & Content | 0 days ago |
| [AlphaNest](https://github.com/cywf/AlphaNest) | TypeScript | General Software Projects | 162 days ago |
| [FortiPath](https://github.com/cywf/FortiPath) | Python | Cybersecurity & Defense | 167 days ago |
| [sentinel-project](https://github.com/cywf/sentinel-project) | TypeScript | Cybersecurity & Defense | 172 days ago |
| [InfraGuard](https://github.com/cywf/Infraguard) | TypeScript | Infrastructure & Networking | 245 days ago |
<!-- END: LEARNING_DYNAMIC -->

</details>

---

## 🌟 GitHub Showcase

<details>
<summary><b>Click to view today's top 3 trending repositories</b></summary>

<!-- START: GH_SHOWCASE -->
| Rank | Repository | Language | Stars today | Description |
|------|------------|----------|-------------|-------------|
| 1 | [asgeirtj/system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) | JavaScript | 1,378 stars today | Extracted system prompts from Anthropic - Claude Fable 5, Opus 4.8, Claude Code, Claude Design. Ope… |
| 2 | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | JavaScript | 1,112 stars today | Production-grade engineering skills for AI coding agents. |
| 3 | [Zackriya-Solutions/meetily](https://github.com/Zackriya-Solutions/meetily) | Rust | 2,494 stars today | Privacy first, AI meeting assistant with 4x faster Parakeet/Whisper live transcription, speaker dia… |
<!-- END: GH_SHOWCASE -->

</details>

---

<div align="center">

_README auto-updated daily by CI workflow • Last update: <!-- UPDATE_TIME -->2026-07-07 11:17 UTC<!-- /UPDATE_TIME --> • Gists sync: <!-- LAST_SYNC -->2026-07-07 11:17 UTC<!-- /LAST_SYNC -->_

**Stay curious, secure, and ready for adventure** 🚀

🌐 **[https://cywf.github.io/cywf/](https://cywf.github.io)**

</div>
