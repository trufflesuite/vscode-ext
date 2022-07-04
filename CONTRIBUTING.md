# Contributing

This project welcomes contributions and suggestions.

If you wish to collaborate and improve the features please raise a PR or issue.

## Commit Rules

We have implemented a few pre-commit hooks via husky and they do the following things:

- Lint the code using (TypeScript ESLint)[https://typescript-eslint.io/docs/linting/]
- Pretty the code using [pretty-quick](https://github.com/azz/pretty-quick)
- Run the Tests
- Check the commit message meets a syntax (more below)

## EditorConfig

We have an editorconfig that should setup your IDE correctly. Using this and eslint together should be seamless in most IDES.

## Commit Syntax

The hardest one will be the commit message syntax. You will need to follow the conventional commits syntax [see here](https://www.conventionalcommits.org/en/v1.0.0/#summary). The tool we are using is [commitlint](https://commitlint.js.org/#/).

In essence your commit has to look like this:

```text

<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

_(taken from link above)_

The commit contains the following structural elements, to communicate intent to the consumers of your library:

- fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
- feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
- BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.
- types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the the Angular convention) recommends `build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others`.
- footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.

## Commit Message Examples

### Commit message with description and breaking change footer

```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

### Commit message with ! to draw attention to breaking change

```
feat!: send an email to the customer when a product is shipped
```

### Commit message with scope and ! to draw attention to breaking change

```
feat(api)!: send an email to the customer when a product is shipped
```

### Commit message with both ! and BREAKING CHANGE footer

```
chore!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

### Commit message with no body

```
docs: correct spelling of CHANGELOG
```

### Commit message with scope

```
feat(lang): add Polish language
```

### Commit message with multi-paragraph body and multiple footers

```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```
