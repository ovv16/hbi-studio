# Установленные скилы — источники и версии

Дата установки: **2026-08-01**. Отбор и проверка: см. [SKILLS-AUDIT.md](SKILLS-AUDIT.md).

Из 9 репозиториев (102 скила суммарно) отобрано **8 скилов**. Репозитории целиком не ставились —
установка всего дала бы +13 439 токенов к каждому запросу.

## Глобальные — `C:\Users\ovv19\.claude\skills\`

| Скил | Репозиторий | Коммит | Дата коммита | Путь в репозитории | Лицензия |
|---|---|---|---|---|---|
| `hallmark` | [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | `aeb42fb354ff4efa36ab475773a082315a3af2ce` | 2026-06-04 | `skills/hallmark/` | см. репозиторий |
| `color-expert` | [meodai/skill.color-expert](https://github.com/meodai/skill.color-expert) | `00ba5c6850b7277dfe6b061c636c68ef7977afc4` | 2026-07-30 | корень репозитория | см. репозиторий |
| `taste-skill` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | `e988add20dab0fa97d7a76781c48961c8184288e` | 2026-07-23 | `skills/taste-skill/` | см. репозиторий |
| `higgsfield-product-photoshoot` | [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills) | `91051d3f260ae0792708c5eb0a87b07122ad3830` | 2026-07-29 | `higgsfield-product-photoshoot/` | см. репозиторий |

## Проектные — `<корень проекта>\.claude\skills\`

> Перенесены сюда 2026-08-01 из `D:\HBI_Studio_claude`, когда актуальным проектом стал
> этот пакет. Старая папка на `D:` не удалена, но считается устаревшей.

| Скил | Репозиторий | Коммит | Дата коммита | Путь в репозитории |
|---|---|---|---|---|
| `gsap-core` | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | `aed9cfd3277740755f6bfc1155c7aa645403b760` | 2026-04-21 | `skills/gsap-core/` |
| `gsap-scrolltrigger` | greensock/gsap-skills | `aed9cfd3277740755f6bfc1155c7aa645403b760` | 2026-04-21 | `skills/gsap-scrolltrigger/` |
| `core-web-vitals` | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | `95d6e255afe1596b557d7a8498517884438f5b3a` | 2026-06-14 | `skills/core-web-vitals/` |
| `accessibility` | addyosmani/web-quality-skills | `95d6e255afe1596b557d7a8498517884438f5b3a` | 2026-06-14 | `skills/accessibility/` |

## Особенности установки

**`hallmark` — дополнительный файл вне папки скила.** Скил на шаге 3 читает каталог тем из
`site/css/tokens.css` (54 КБ) по относительному пути `../../../site/css/tokens.css`. Файл скопирован
в `C:\Users\ovv19\.claude\site\css\tokens.css` — именно туда, куда эти ссылки резолвятся при установке
в `~/.claude/skills/hallmark/`. **При обновлении hallmark обновлять и его.**

**`color-expert` — установлен целиком.** SKILL.md лежит в корне репозитория, а `references/` (2,6 МБ
исследовательской базы по цвету) нужен полностью. Исключены только `.git` и `.gitignore`.

**`core-web-vitals` и `accessibility` — есть висячие ссылки.** Оба ссылаются на соседние скилы из
своего репозитория (`../performance/SKILL.md`, `../web-quality-audit/SKILL.md`), которые не ставились.
Это ссылки вида «см. также», на работу не влияют.

**`taste-skill`** — установлено только ядро. В репозитории ещё 12 скилов (стилевые варианты:
минимализм, брутализм, brandkit и т. д.), они намеренно пропущены.

**`higgsfield-product-photoshoot`** — 1 из 7 скилов репозитория. Остальные (генерация игр, сайты,
soul-id, marketplace-карточки) к задачам салона отношения не имеют.

## Как обновлять

Marketplace-установка недоступна: ни один из репозиториев не опубликован как плагин Claude Code,
поэтому всё скопировано вручную. Для обновления:

```bash
git clone --depth 1 https://github.com/<repo>.git /tmp/upd && diff -r /tmp/upd/<path> ~/.claude/skills/<skill>
```

Сверяйте коммит из таблицы с текущим `HEAD` репозитория — так видно, что изменилось с момента установки.

## Что НЕ ставилось и почему

| Репозиторий | Скилов | Причина |
|---|---|---|
| `coreyhaines31/marketingskills` | 49 | 8 569 токенов в каждом запросе — больше, чем вся установка целиком; тотальное пересечение с inline-плагином `marketing:*` |
| `zubair-trabzada/geo-seo-claude` | 16 | Инсталлятор ставит 5 агентов в `~/.claude/agents/`, venv, 9 пакетов и Playwright Chromium (~150 МБ); GEO под ИИ-поиск для локального салона менее полезен, чем локальный SEO |
| `Vincentwei1021/video-shotcraft` | 1 | Дублирует `remotion-superpowers`, которым вы пользуетесь |
| остальные скилы из взятых репозиториев | 71 | Вес описаний без пользы под текущие задачи |

## Проверка безопасности

Два прохода: ручной разбор (чтение всех SKILL.md и скриптов, грепы на сеть, секреты, хуки)
и **SkillSpector v2.5.1** (NVIDIA) — статический режим `--no-llm`, 68 сигнатур, YARA, AST, taint-tracking.

### Установка SkillSpector

```bash
uv tool install --python 3.12 git+https://github.com/NVIDIA/skillspector.git
```

Ключ — **Python 3.12**: под него есть готовое колесо `yara-python`. На 3.14 (который uv берёт по
умолчанию) колеса нет, начинается сборка из исходников и требуется MSVC Build Tools. Docker не нужен.

Запуск: `skillspector scan <путь> --recursive --no-llm`

### Результаты, 2026-08-01

| Скил | Score | Severity | Находок |
|---|---|---|---|
| `gsap-core`, `gsap-scrolltrigger` | 0 | LOW | 0 |
| `higgsfield-product-photoshoot` | 0 | LOW | 0 |
| `core-web-vitals` | 24 | MEDIUM | 2 |
| `accessibility` | 27 | MEDIUM | 3 |
| `hallmark` | 32 | MEDIUM | 6 |
| `taste-skill` (внутреннее имя `design-taste-frontend`) | 15 | LOW | 4 |
| `color-expert` | **60** | **HIGH** | 21 |

### Разбор находок

**Почти все — ложные срабатывания по ключевым словам.** Разобраны вручную:

- `color-expert`, CRITICAL «kill people» (уверенность 0,285) — совпадение внутри искусствоведческого
  текста про промышленные краски середины XX века. Ложное.
- `color-expert`, HIGH «Credential Access / keychain» (0,21) — речь о физическом брелоке
  (Color Fidget — брелок-цветовой круг). Ложное.
- `color-expert`, HIGH «Hidden Instructions» ×13 (0,21) — директивы линтера вида
  `<!-- markdownlint-disable MD060 -->`. Ложные.
- `accessibility` и `core-web-vitals`, HIGH «Hidden Instructions» — HTML-комментарии в примерах кода
  (`<!-- ✅ Language specified -->`). Ложные.
- `hallmark`, HIGH «access secrets» (0,35) — проза про обнаружение `design.md`. Ложное.

**Три находки настоящие** — не уязвимости, а директивы, влияющие на поведение агента:

| Скил | Находка | Суть |
|---|---|---|
| `color-expert` | Anti-Refusal «Don't lecture» (уверенность **0,85**) | Указание модели не читать нотации о тоне ответа. Безобидно по смыслу, но это инструкция про поведение. |
| `hallmark` | Excessive Agency «without asking» (0,75) | В image-режиме скил пишет `design.md` **без подтверждения** — считает, что права на приложенный скриншот у пользователя. |
| `taste-skill` | Excessive Agency «Do not ask the user» (0,8) | Не спрашивает про параметры (MOTION_INTENSITY, VISUAL_DENSITY), берёт значения по умолчанию. |

Ни в одном скиле нет хуков, обращений к `~/.ssh` / `.env` / credentials, сетевых вызовов и попыток
переопределить системные инструкции. Категория «MCP Rug Pull» с пустым паттерном срабатывает
на нескольких скилах — эвристика по версионированию, содержательных данных не даёт.
