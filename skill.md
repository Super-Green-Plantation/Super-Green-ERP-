# Detecting Duplicate Logic and Functions

This guide explains how to use existing Claude Code skills to detect duplicate logic and functions in your code changes.

## Suitable Skills

1. `simplify`: This skill reviews changed code for reuse, simplification, efficiency, and altitude cleanups. It can identify duplicate code and suggest refactoring to remove duplication.

2. `code-review`: This skill reviews the current diff for correctness bugs and reuse/simplification/efficiency cleanups. It can also detect duplicate code in the changes.

## How to Use

To detect duplicate logic in your current changes (staged or unstaged), run:

```
/simplify
```

or

```
/code-review
```

These skills will analyze your changes and report any duplicate code they find, along with suggestions for refactoring.

## For Entire Codebase

Note: The above skills are designed to work on changes (diffs). To check for duplicates in the entire codebase, consider:

- Using the Agent tool with the `explore` or `general-purpose` agent to run custom duplicate detection scripts (e.g., using tools like `jscpd`, `simian`, or `ast-grep`).
- Creating a custom skill for duplicate detection (see below).

## Creating a Custom Skill for Duplicate Detection

If you frequently need to check for duplicates, you can create a custom skill. Here's an example of what a custom skill might look like:

```yaml
name: duplicate-detector
description: Detects duplicate logic and functions in the codebase.
inputs:
  - name: path
    description: The directory or file to scan for duplicates.
    required: false
    default: .
# The skill would then run a duplicate detection tool on the specified path.
```

However, note that Claude Code does not natively support custom skills in YAML format. Custom skills are typically implemented as shell scripts or Node.js scripts and placed in the `~/.claude/skills/` directory.

For more information on creating custom skills, refer to the Claude Code documentation.

## Conclusion

For immediate use on your current changes, use the `/simplify` or `/code-review` commands. For whole-codebase duplicate detection, consider using external tools or creating a custom skill.