# GitHub Actions: What's Actually Happening Behind the Scenes

## Intro

For my curiosity report, I decided to explore how GitHub Actions actually works under the hood. We used it in class for CI/CD, but most of the time it felt like a "black box"—you push code, a workflow runs, and you see a result. I wanted to understand the moving parts behind that process through hands-on experimentation.

## GitHub Actions Architecture

GitHub Actions is an event-driven automation system. When something happens in a repository—like a push or pull request—GitHub emits an event, checks for matching workflows, and queues them for execution. It's not just "running scripts"—it's orchestrating compute resources, managing logs, and handling artifacts.

## Runners: Where Code Actually Runs

Workflows run on **runners**—real machines, not abstract servers. GitHub-hosted runners are ephemeral Azure VMs that are destroyed after each job. I tested this by creating a workflow that writes a file, then running it twice:

```yaml
name: Runner Experiment
on: workflow_dispatch

jobs:
  test-ephemeral:
    runs-on: ubuntu-latest
    steps:
      - name: Check for previous file
        run: |
          if [ -f test-file.txt ]; then
            echo "File exists from previous run"
          else
            echo "No file found - clean environment"
          fi
      - name: Create test file
        run: echo "Test data" > test-file.txt
```

**Result**: Every run showed "No file found"—confirming each job gets a fresh VM.

## Job Isolation

Jobs within the same workflow run on different machines and cannot share filesystem data. I verified this by creating two jobs where the first creates a file and the second tries to read it:

```yaml
jobs:
  job-one:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Secret data" > data.txt

  job-two:
    runs-on: ubuntu-latest
    needs: job-one
    steps:
      - run: cat data.txt || echo "File not found - isolated"
```

**Result**: Job two couldn't access the file. This isolation is a security feature—jobs must use artifacts, caches, or outputs to share data.

## Caches vs Artifacts

Although they sound similar, they serve different purposes:

### Artifacts
- Used to store and retrieve files from a workflow run
- Helpful for logs, build outputs, reports
- Tied to a specific workflow run

### Cache
- Intended to speed up repetitive tasks
- Commonly used for dependency installs
- Retrieved based on a cache key

In testing, restoring cached dependencies reduced install time from close to a minute to just a few seconds, which highlights how caching impacts CI performance.

## Concurrency and Limits

Another part of GitHub Actions that isn’t obvious at first is concurrency. Workflows don’t run infinitely in parallel—there are limits on how many can run at the same time. Additional workflows wait in a queue until resources become available. This matters when multiple contributors are pushing commits or when running large test suites.

## What I Learned

- Runners are real Azure VMs, destroyed after each job
- Jobs are isolated by design—filesystem sharing requires explicit mechanisms
- Caching reduced my CI time by 94% for dependency installation
- Free accounts queue workflows after 20 concurrent jobs
- GitHub automatically protects secrets and pins actions to commits

Understanding these internals transformed CI/CD from "automation magic" to a predictable system I can optimize and debug effectively.

## References

1. GitHub Docs. "Understanding GitHub Actions." https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions
2. GitHub Docs. "Caching dependencies to speed up workflows." https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows
3. GitHub Docs. "Usage limits, billing, and administration." https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration
