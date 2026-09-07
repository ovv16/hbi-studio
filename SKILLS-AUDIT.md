# Аудит установки Claude Code

**Дата:** 2026-08-01
**Машина:** Windows 11 Pro (`C:\Users\ovv19`) + WSL2/Ubuntu (`/home/ovv19`)
**Рабочая директория:** `D:\HBI_Studio_claude` (не git-репозиторий)
**Режим:** только чтение. Ничего не удалено, не изменено, не переустановлено.

---

## 0. Карта окружения

| Что | Windows | WSL2/Ubuntu |
|---|---|---|
| `~/.claude/skills/` | 9 скилов | **отсутствует** |
| `~/.claude/settings.json` | есть (плагины + тема, **хуков нет**) | **отсутствует** |
| `~/.claude.json` | 44 849 б, 8 проектов, 1 MCP | 26 201 б, 2 проекта, 2 MCP |
| `~/.claude/plugins/` | 3 marketplace, 2 установленных плагина | только marketplace-клон, плагинов нет |
| `~/.claude/CLAUDE.md` | **нет** | **нет** |
| `./CLAUDE.md` | **нет** | — |
| `./.mcp.json` | **нет** | — |
| `./.claude/settings.local.json` | есть, 49 permissions, хуков нет | — |
| `./.claude/skills/` | 1 скил (`ui-ux-pro-max`) | — |
| statusline | не настроен | не настроен |

Профили **разные**. WSL — стоячий, последняя активность 19 апреля 2026, скилов и настроек там нет, но **лежат два MCP-сервера с ключами в открытом виде** (см. раздел 3).

Всего запусков Claude Code на Windows: **3** (`numStartups`), первый — 2026-05-15.

---

## 1. Инвентаризация скилов

### 1.1 Глобальные — `C:\Users\ovv19\.claude\skills\`

| Скил | Источник | Изменён | Размер папки | scripts/hooks |
|---|---|---|---|---|
| `caveman` | вручную через `npx skills add` (автор неизвестен, есть README+CHANGELOG) | 2026-06-22 | 12 KB | нет |
| `find-skills` | GitHub `vercel-labs/skills` (зафиксировано в `skills-lock.json`) | 2026-06-13 | 8 KB | нет |
| `insecure-defaults` | GitHub `trailofbits/skills` | 2026-06-22 | 25 KB | нет (только `agents/openai.yaml` — конфиг, не код) |
| `playwright-cli` | GitHub `microsoft/playwright-cli` | 2026-06-22 | 84 KB | нет |
| `react-native-best-practices` | GitHub `callstackincubator` | 2026-06-22 | **6 597 KB** | нет (6 МБ — это PNG-скриншоты в `references/images/`) |
| `remotion-best-practices` | GitHub `remotion-dev/skills` | 2026-06-22 | 225 KB | нет (есть 3 `.tsx`-примера, не исполняются) |
| `stop-slop` | GitHub `hardikpandya/stop-slop` | 2026-06-22 | 36 KB | нет |
| `ui-ux-pro-max` | GitHub `nextlevelbuilder/ui-ux-pro-max-skill` | 2026-06-13 | 50 KB | `data/` и `scripts/` — **битые симлинки** |
| `web-scraping` | симлинк → `C:\Users\ovv19\.agents\skills\web-scraping` | 2026-06-22 | 4 KB | нет |

Источники восстановлены из `settings.local.json` (история команд `npx skills@latest add …`) и `skills-lock.json`. Marketplace-скилов среди глобальных нет — все поставлены вручную через `npx skills`.

### 1.2 Проектные — `D:\HBI_Studio_claude\.claude\skills\`

| Скил | Источник | Изменён | Размер | Примечание |
|---|---|---|---|---|
| `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill` (`skills-lock.json`) | 2026-06-13 | 50 KB | **побайтовый дубль глобального** (SKILL.md 45 434 б, тот же mtime) |

### 1.3 Плагины

| Плагин | Marketplace | Версия | Scope | Установлен | Что даёт |
|---|---|---|---|---|---|
| `remotion-superpowers` | GitHub `DojoCodingLabs/remotion-superpowers` | 2.1.0 (`9cd0466`) | user | 2026-06-15 | 16 команд-скилов, 2 скила, 3 агента, **4 хука**, 5 MCP-серверов |
| `google-image-gen` | GitHub `ypfaff/google-image-gen-plugin` | 1.0.0 (`5c22d91`) | **project → `C:\Users\ovv19`** | 2026-06-16 | 1 скил, Python-скрипт `main.py` + `check_env.sh` |

Marketplace `claude-plugins-official` (anthropics) склонирован, но **ни один плагин из него не установлен** (36 доступных лежат мёртвым грузом на диске).

Плюс ~10 **inline-плагинов**, вшитых в само приложение и активных без вашего участия: `anthropic-skills`, `engineering`, `marketing`, `finance`, `product-management`, `design`, `figma`, `pdf-viewer`, `postiz`, `cowork-plugin-management`. Именно они дают основную массу описаний в контексте (раздел 5.4).

---

## 2. Разбор содержимого скилов

| Скил | Что делает (одной строкой) | Триггер (по description) | Длина description | Исполняемые файлы |
|---|---|---|---|---|
| `caveman` | Сжимает ответы модели в «пещерный» телеграфный стиль ради экономии токенов | «caveman mode», «talk like caveman», «less tokens», «be brief», `/caveman` | 392 | нет |
| `find-skills` | Ищет и ставит новые скилы по запросу «как мне сделать X» | «how do I do X», «find a skill for X», «is there a skill that…» | 303 | нет |
| `insecure-defaults` | Ищет fail-open дефолты: захардкоженные секреты, слабая аутентификация | «auditing security», «reviewing config management», «environment variable handling» | 239 | нет |
| `playwright-cli` | Автоматизация браузера и написание Playwright-тестов | «Automate browser interactions», «Playwright tests» | 77 | нет |
| `react-native-best-practices` | Гайд по перформансу React Native: FPS, TTI, бандл, утечки | «Hermes», «FlashList», «jank», «frame drops», «bundle size» | 273 | нет |
| `remotion-best-practices` | Правила и рецепты по Remotion (видео на React) | «Remotion», «Video creation in React» | 53 | нет |
| `stop-slop` | Вычищает из текста типовые AI-обороты | «drafting, editing, or reviewing text», «AI tells» | 119 | нет |
| `ui-ux-pro-max` | Большая база UI/UX: 50+ стилей, 161 палитра, 57 пар шрифтов, гайдлайны | ~40 ключевых слов: design, build, review, fix, improve, refactor, dashboard, landing page, button, modal, glassmorphism, dark mode, typography… | **916 ⚠** | нет (папки `data/`, `scripts/` битые) |
| `web-scraping` | Скрейпинг и извлечение данных питоновскими инструментами | «web scraping», «data extraction», «Python» | 60 | нет |

**Длиннее ~500 символов: только `ui-ux-pro-max` (916 символов).** Остальные в норме.

Ни в одном скиле нет `package.json`, `requirements.txt`, бинарников, `.sh`, `.ps1`, `.bat`. Единственный исполняемый код у скилов — `.tsx`-примеры внутри `remotion-best-practices/rules/assets/` (данные для копипаста, не запускаются).

---

## 3. Проверка безопасности

Метод: рекурсивный grep по всем файлам скилов и плагинов на `curl|wget|Invoke-WebRequest|nc|ssh|scp`, на обращения к `~/.ssh`, `.env`, `credentials`, `id_rsa`, `.aws`, `.npmrc`, на формулировки перехвата поведения («ignore previous instructions», «without confirmation», «auto-approve», «bypass», «--dangerously»), плюс инвентаризация доменов.

### 3.1 Скилы — все ЧИСТО

| Проверка | Результат |
|---|---|
| `curl` / `wget` / `Invoke-WebRequest` / `nc` / `ssh` / `scp` | **0 совпадений во всех 9 скилах** |
| Чтение `~/.ssh`, `.env`, `credentials`, `id_rsa`, `.aws` | **0**. Все совпадения на «secret/password/api_key» — внутри `insecure-defaults/references/examples.md`, это его собственный корпус примеров уязвимого кода (`SECRET_KEY = os.environ.get(..., 'dev-secret-key-123')` и т.п.). Ожидаемо для скила-аудитора. |
| Попытки переопределить поведение, отключить подтверждения | **0 совпадений** |
| Автоматические хуки внутри скилов | **нет ни одного** |
| Домены | Все — документация и примеры: `remotion.dev`, `remotion.media`, `playwright.dev`, `react.dev`, `docs.expo.dev`, `developer.android.com`, `bundlephobia.com`, `github.com`, `skills.sh`, `hvpandya.com`, `example.com`. Сетевых вызовов из самих скилов нет — только ссылки в тексте. |
| Запрашиваемые permissions | Только `google-image-gen` объявляет `allowed-tools: Bash, Read, Glob` — адекватно задаче (запускает свой Python-скрипт). Остальные скилы permissions не запрашивают. |

**Вердикт по всем 9 скилам: ЧИСТО.**

### 3.2 КРИТИЧНО — API-ключи открытым текстом в конфигах

**WSL — `/home/ovv19/.claude.json`, секция `mcpServers`:**

```
mcp-image      → env.GEMINI_API_KEY = "AQ.Ab8RN6KKcg…"            (Google AI)
mcp-image-oai  → env.OPENAI_API_KEY = "sk-proj-LgNOFcj-…BlbkFJ…"  (OpenAI, живой формат)
```

**Windows — `C:\Users\ovv19\.claude.json`:**

```
magic → env.API_KEY = "896aca77…ae53"   (21st.dev Magic)
```

Три ключа лежат в plaintext-JSON без шифрования, читаемые любым процессом от вашего имени. Рядом — `C:\Users\ovv19\.claude.json.backup` (42 KB, 20 июля), в котором с высокой вероятностью те же ключи ещё и в старой копии. Дополнительно: ключ OpenAI из WSL сейчас попал в вывод этой сессии — **считайте его скомпрометированным независимо от остального**.

**Рекомендация (выполнять вам):** отозвать и перевыпустить все три ключа; хранить их в переменных окружения, а в конфиге ссылаться как `"${OPENAI_API_KEY}"` — ровно так, как это уже сделано в `remotion-superpowers/.mcp.json`.

### 3.3 ПОДОЗРИТЕЛЬНО — permissions в проекте шире, чем нужно

`D:\HBI_Studio_claude\.claude\settings.local.json`, список `allow` (49 записей). Проблемные:

| Правило | Почему шире, чем нужно |
|---|---|
| `Read(//c/Users/ovv19/**)` | Предодобрено чтение **всей домашней директории**, включая `.ssh`, `.claude.json` с ключами, `.mcp-auth`, OneDrive, Downloads. Разрешение выдано ради одной проверки шрифтов. |
| `Bash(npm install *)` | Установка **любого** npm-пакета без подтверждения — с исполнением install-скриптов. |
| `Bash(npx skills *)` | Скачивание и установка **любого** скила из интернета без подтверждения. |
| `Bash(npm view *)`, `Bash(npx skills@latest add …)` ×8 | Разовые команды из истории, навсегда осевшие в allow-листе. |

Сами по себе не вредоносны — это ваши же прошлые «да, разрешить». Но в сумме они снимают подтверждение с трёх операций, через которые обычно и приходит чужой код.

### 3.4 ПОДОЗРИТЕЛЬНО — хуки плагина `remotion-superpowers` (4 шт., срабатывают без подтверждения)

`~/.claude/plugins/cache/remotion-superpowers/remotion-superpowers/2.1.0/hooks/hooks.json`:

| Событие | Matcher | Команда |
|---|---|---|
| PreToolUse | `generate_tts\|generate_music\|generate_sfx\|generate_image\|generate_video\|generate_subtitles\|list_assets` | `sh scripts/check-mcp-server.sh remotion-media KIE_API_KEY` |
| PreToolUse | `replicate_run\|replicate_create_prediction` | `sh scripts/check-mcp-server.sh replicate REPLICATE_API_TOKEN` |
| PostToolUse | `searchPhotos\|searchVideos\|downloadVideo` | `sh scripts/post-tool-note.sh pexels-attribution` |
| PostToolUse | `render` | `sh scripts/post-tool-note.sh captions-tip` |

**Содержимое скриптов прочитано целиком — оно безобидное:** `check-mcp-server.sh` делает `printenv` на имя переменной и блокирует вызов, если ключ не задан; `post-tool-note.sh` печатает текстовую подсказку про атрибуцию Pexels и про субтитры. Ни сети, ни файлов, ни секретов.

**Проблема не в содержимом, а в форме записи:** путь `scripts/check-mcp-server.sh` — **относительный**. Он резолвится от текущей рабочей директории, а не от `${CLAUDE_PLUGIN_ROOT}`. Если вы запустите Claude Code в репозитории, где есть свой `scripts/check-mcp-server.sh`, при первом же вызове генерации медиа выполнится **чужой файл**, автоматически и без подтверждения. Это единственная в вашей установке точка автоматического исполнения кода.

### 3.5 ПОДОЗРИТЕЛЬНО — MCP-серверы, тянущие код из сети при каждом старте

| Сервер | Команда | Риск |
|---|---|---|
| `magic` (Windows) | `npx -y @21st-dev/magic@latest` | `@latest` + `-y` = свежий код с npm без фиксации версии, каждый запуск |
| `mcp-image` (WSL) | `npx -y mcp-image` | **неймспейс-неймсквоттинг-риск**: пакет без скоупа, короткое имя |
| `TwelveLabs` (плагин) | `npx -y twelvelabs-mcp` | то же |
| `Replicate` (плагин) | `npx -y mcp-remote https://mcp.replicate.com/sse` | проксирует на внешний SSE-endpoint |
| `ElevenLabs`, `Pexels` (плагин) | `uvx elevenlabs-mcp` / `uvx pexels-mcp-server` | то же для Python |
| `remotion-media` (плагин) | `npx remotion-media-mcp` | то же |
| `mcp-image-oai` (WSL) | `node /home/ovv19/mcp-image/dist/index.js` | локальный, но собранный вами `dist` — проверьте, что это ваш код |

Ключи в плагинных MCP (`remotion-superpowers/.mcp.json`) заданы **правильно** — через `${ENV_VAR}`, захардкоженных нет. Это единственный конфиг в вашей установке, сделанный по-хорошему.

### 3.6 ЧИСТО — плагин `google-image-gen`

`main.py`, `check_env.sh`, `SKILL.md` прочитаны. Скрипт вызывает только `google.genai`, читает ключ из `~/.config/google-image-gen/.env` или env-переменной, пишет PNG в указанный путь. Обращений к посторонним файлам, сети мимо Gemini API, попыток перехвата поведения нет. Единственная странность — установлен со `scope: "project"` и `projectPath: C:\Users\ovv19`, то есть формально активен только в домашней папке, но в `~/.claude/settings.json` включён глобально. Несоответствие безвредное, но объясняет, почему он мог не подхватываться в `D:\`.

### 3.7 Сводка по уровням

| Уровень | Находки |
|---|---|
| **КРИТИЧНО** | 3 API-ключа plaintext в `~/.claude.json` (Win + WSL) + вероятная копия в `.claude.json.backup` |
| **ПОДОЗРИТЕЛЬНО** | Относительный путь в хуках `remotion-superpowers`; `Read(//c/Users/ovv19/**)`, `Bash(npm install *)`, `Bash(npx skills *)` в allow-листе; 7 MCP через `npx -y @latest` |
| **ЧИСТО** | Все 9 глобальных скилов, проектный `ui-ux-pro-max`, плагин `google-image-gen`, содержимое скриптов хуков `remotion-superpowers` |

---

## 4. Конфликты и мусор

### 4.1 Пересекающиеся триггеры

| Группа | Конкуренты | Суть конфликта |
|---|---|---|
| **UI/дизайн** | `ui-ux-pro-max` (916 симв., ~40 ключевых слов) vs `design:design-critique`, `design:design-system`, `design:accessibility-review`, `design:ux-copy` vs 12 скилов `figma:*` | `ui-ux-pro-max` ловит слова «build», «review», «fix», «improve», «refactor», «optimize» — то есть **почти любой запрос про фронтенд**. Для вашего проекта (HBI Studio — вёрстка + Figma) эти три группы дерутся постоянно. |
| **Remotion/видео** | `remotion-best-practices` (скил) vs 18 скилов `remotion-superpowers:*` (плагин) | Первый — правила кода, второй — пайплайн производства. Оба откликаются на «Remotion», «video», «captions», «music». |
| **Стиль текста** | `caveman` vs `stop-slop` | **Прямо противоположные**: один режет текст до телеграфа, второй полирует прозу. Оба претендуют на «редактирование вывода». |
| **Безопасность** | `insecure-defaults` vs встроенный `security-review` vs `engineering:code-review` | Три разных чек-листа на «проверь безопасность». |
| **Браузер** | `web-scraping` vs `playwright-cli` | Оба на «извлечь данные с сайта / автоматизировать браузер». |
| **Внутри inline-плагинов** | `product-management:brainstorm` ≡ `product-management:product-brainstorming`; `marketing:content-creation` ≡ `marketing:draft-content`; `finance:journal-entry` ≡ `finance:journal-entry-prep`; `product-management:competitive-brief` ≡ `marketing:competitive-brief` | Буквальные дубли, вшиты в приложение — вы на них повлиять не можете, но они едят контекст. |

### 4.2 Дубли

1. **`ui-ux-pro-max` — глобально и в проекте.** Побайтово идентичны (SKILL.md 45 434 б, mtime 2026-06-13 у обоих). Проектная копия перекрывает глобальную и не даёт ничего сверх неё.
2. **`remotion-superpowers` числится дважды** в `pluginUsage`: `@inline` (21 использование) и `@remotion-superpowers` (0 использований). Реально работает inline-версия из приложения; установленная вами копия 2.1.0 из GitHub — лишняя, но именно её хуки зарегистрированы.
3. **`google-image-gen`** — тоже дважды: `@inline` (0) и `@google-image-gen` (1).

### 4.3 Битые симлинки — `ui-ux-pro-max` работает наполовину

В **обеих** копиях (глобальной и проектной) `data` и `scripts` — это не папки, а симлинк-файлы:

```
data    → ../../../src/ui-ux-pro-max/data
scripts → ../../../src/ui-ux-pro-max/scripts
```

Цели резолвятся в `C:\Users\ovv19\.claude\src\…` и `D:\HBI_Studio_claude\src\…`. **Обеих директорий не существует.** То есть 161 палитра, 57 пар шрифтов и все скрипты, ради которых скил и ставился, недоступны — остаётся только 45 КБ текста SKILL.md, который ссылается на несуществующие файлы. Скил при срабатывании будет пытаться их прочитать и упрётся в ошибку.

### 4.4 Чем вы не пользовались

Источник — `skillUsage` из `~/.claude.json` (сверено с `~/.claude/projects/*.jsonl`, 14 сессий, оба источника сходятся):

**Срабатывали:** `find-skills` ×4, `ui-ux-pro-max` ×2, `pdf` ×1, `stop-slop` ×1, `caveman` ×1, `remotion-superpowers:setup` ×2, `remotion-superpowers:create-video` ×2, `remotion-superpowers:add-music` ×1, `google-image-gen` ×1.

**Ни разу не срабатывали за всё время:**

| Скил | Занимает | Комментарий |
|---|---|---|
| `react-native-best-practices` | **6,6 МБ** | React Native в ваших проектах отсутствует |
| `remotion-best-practices` | 225 КБ | перекрыт плагином `remotion-superpowers`, который вы реально используете |
| `playwright-cli` | 84 КБ | e2e-тестов в проектах нет |
| `insecure-defaults` | 25 КБ | — |
| `web-scraping` | 4 КБ | — |

**Плагины с нулевым использованием:** `postiz`, `design`, `figma`, `engineering`, `marketing`, `product-management`, `finance`, `cowork-plugin-management`, `anthropic-skills` — все `usageCount: 0` (inline, отключаются только в настройках приложения).

**Мёртвый груз на диске:** склонированный marketplace `claude-plugins-official` с 36 плагинами, из которых не установлен ни один.

---

## 5. Сводная таблица и вердикты

### 5.1 Скилы

| Скил | Источник | description | Безопасность | Вердикт |
|---|---|---|---|---|
| `find-skills` | vercel-labs/skills | 303 | ЧИСТО | **ОСТАВИТЬ** — самый используемый (×4), описание в норме |
| `stop-slop` | hardikpandya/stop-slop | 119 | ЧИСТО | **ОСТАВИТЬ** — компактный, использовался, полезен для текстов HBI |
| `caveman` | вручную | 392 | ЧИСТО | **ОСТАВИТЬ, но помнить о конфликте** — прямо противоречит `stop-slop`; держите оба только если вызываете через `/caveman` явно |
| `ui-ux-pro-max` (глобальный) | nextlevelbuilder | **916 ⚠** | ЧИСТО, но **сломан** | **ПЕРЕПИСАТЬ description + починить симлинки** — ядро вашего дизайн-воркфлоу, но 916 символов ловят половину запросов, а `data/`+`scripts/` не существуют |
| `ui-ux-pro-max` (проектный) | nextlevelbuilder | 916 | ЧИСТО, сломан | **УДАЛИТЬ** — побайтовый дубль глобального, ничего не добавляет |
| `remotion-best-practices` | remotion-dev/skills | 53 | ЧИСТО | **УДАЛИТЬ** — 0 использований, функционально перекрыт плагином `remotion-superpowers` (21 использование) |
| `react-native-best-practices` | callstackincubator | 273 | ЧИСТО | **УДАЛИТЬ** — 0 использований, 6,6 МБ, RN в ваших проектах нет |
| `playwright-cli` | microsoft | 77 | ЧИСТО | **УДАЛИТЬ** — 0 использований; вернуть, когда появятся e2e-тесты |
| `web-scraping` | локальный симлинк `.agents` | 60 | ЧИСТО | **УДАЛИТЬ** — 0 использований, дешёвый (60 симв.), но пересекается с `playwright-cli` |
| `insecure-defaults` | trailofbits/skills | 239 | ЧИСТО | **ОСТАВИТЬ** — 0 использований, но 239 символов дёшево, а скил от Trail of Bits ловит ровно тот класс проблем, который у вас уже есть (ключи в конфигах) |

### 5.2 Плагины

| Плагин | Безопасность | Вердикт |
|---|---|---|
| `remotion-superpowers` @2.1.0 (GitHub) | ПОДОЗРИТЕЛЬНО (относительный путь в хуках) | **ОСТАВИТЬ с оговоркой** — реально используется (21), но inline-версия дублирует его; хуки стоит обезвредить или удалить локальную копию |
| `google-image-gen` @1.0.0 | ЧИСТО | **ОСТАВИТЬ** — код проверен, безобиден |
| marketplace `claude-plugins-official` | ЧИСТО | **УДАЛИТЬ клон** — 0 установленных плагинов, только занимает диск |
| inline-плагины (10 шт.) | ЧИСТО | **ОТКЛЮЧИТЬ неиспользуемые** через настройки приложения — 8 из 10 с `usageCount: 0`, но именно они дают основной вес контекста |

### 5.3 MCP-серверы

| Сервер | Где | Вердикт |
|---|---|---|
| `magic` | Windows `~/.claude.json` | **ПЕРЕНЕСТИ КЛЮЧ В ENV** + зафиксировать версию вместо `@latest` |
| `mcp-image` | WSL `~/.claude.json` | **ОТОЗВАТЬ КЛЮЧ**; профиль WSL мёртв с апреля — сервер можно убрать целиком |
| `mcp-image-oai` | WSL `~/.claude.json` | **ОТОЗВАТЬ КЛЮЧ НЕМЕДЛЕННО** (`sk-proj-…` живого формата) |
| 5 серверов `remotion-superpowers` | плагин `.mcp.json` | **ОСТАВИТЬ** — единственный конфиг с правильным `${ENV_VAR}` |
| ~24 коннектора `plugin:*` (github, figma, notion, slack, linear…) | приложение | Не авторизованы, тулы недоступны. Авторизация — через настройки коннекторов на claude.ai либо `claude mcp` / `/mcp` в интерактивной сессии. **Отключите те, которыми не пользуетесь** — они всё равно объявляются. |

### 5.4 Оценка веса description в токенах на один запрос

Метод: точный подсчёт символов `description` из frontmatter для всего, что лежит на диске; для inline-плагинов (вшиты в приложение, на диске отсутствуют) — оценка по числу записей в загруженном списке скилов при средней длине, замеренной на `remotion-superpowers` (189 симв./запись) и на длинных описаниях `figma:*`/встроенных. Пересчёт символов в токены — делением на 4 (типично для английского технического текста).

| Группа | Записей | Символов | ≈ Токенов |
|---|---|---|---|
| **Ваши скилы** (9 уникальных, глобальные) | 9 | **2 432** (замерено точно) | **~610** |
| `remotion-superpowers` (команды + скилы) | 18 | **3 021** (замерено точно) | ~755 |
| `figma:*` | 12 | ~5 400 | ~1 350 |
| Встроенные Claude Code (`dataviz`, `claude-api`, `simplify`, `run`, `loop`…) | 14 | ~4 900 | ~1 225 |
| `product-management:*` | 9 | ~2 520 | ~630 |
| `marketing:*` | 8 | ~2 320 | ~580 |
| `engineering:*` | 10 | ~2 500 | ~625 |
| `finance:*` | 8 | ~2 000 | ~500 |
| `pdf-viewer:*`, `postiz`, `cowork-*`, `design:*`, `anthropic-skills:*` | 31 | ~2 300 | ~575 |
| **ИТОГО** | **~119** | **~27 400** | **≈ 6 850 токенов на каждый запрос** |

**Что из этого ваше и подлежит вашему контролю:** ~610 токенов (9%). Из них **`ui-ux-pro-max` один занимает 916 символов ≈ 230 токенов — 38% всего вашего бюджета описаний.** Остальные ~6 240 токенов дают плагины: inline (вшиты, отключаются только в настройках приложения) и `remotion-superpowers`.

Если выполнить вердикты из 5.1 (снять 4 неиспользуемых скила — 463 симв. — и сжать `ui-ux-pro-max` с 916 до ~250 символов): ваша часть падает с ~610 до **~325 токенов** (−47%). В масштабе всего списка это ~4% общего веса.

**Настоящая экономия сидит в отключении 8 неиспользуемых inline-плагинов** (`marketing`, `finance`, `product-management`, `engineering`, `design`, `postiz`, `cowork-plugin-management`, `figma` — все с `usageCount: 0`): это ~2 600–3 900 токенов, то есть **38–57% всего веса описаний**. Делается в настройках приложения, а не в файлах.

---

## 6. Требует вашего решения

### 6.1 КРИТИЧНО — сделать сегодня

1. **Отозвать и перевыпустить OpenAI-ключ** `sk-proj-LgNOFcj-…` из `/home/ovv19/.claude.json`. Он лежал plaintext и попал в вывод этой сессии — считайте его скомпрометированным.
2. **Отозвать и перевыпустить Google AI-ключ** `AQ.Ab8RN6KKcg…` оттуда же.
3. **Перевыпустить ключ 21st.dev Magic** `896aca77…` из `C:\Users\ovv19\.claude.json`.
4. **Проверить `C:\Users\ovv19\.claude.json.backup`** (42 KB, 20 июля) — в нём почти наверняка старые копии тех же ключей.
5. После перевыпуска — хранить ключи в переменных окружения, а в конфигах писать `"${OPENAI_API_KEY}"`, как это уже сделано в `remotion-superpowers/.mcp.json`.

### 6.2 ПОДОЗРИТЕЛЬНО — решить в ближайшее время

6. **Хуки `remotion-superpowers` с относительным путём.** Четыре хука запускают `sh scripts/check-mcp-server.sh` / `sh scripts/post-tool-note.sh` от текущей рабочей директории. Сами скрипты безобидны, но в чужом репозитории с такими же путями выполнится посторонний файл — автоматически, без подтверждения. Варианты: (а) заменить путь на `${CLAUDE_PLUGIN_ROOT}/scripts/…`, (б) удалить локальную копию плагина 2.1.0 и пользоваться inline-версией, у которой этих хуков нет.
7. **`Read(//c/Users/ovv19/**)` в `settings.local.json`.** Предодобряет чтение всей домашней папки, включая `.ssh`, `.mcp-auth` и сами `.claude.json` с ключами. Выдано ради одной проверки шрифтов — стоит сузить до конкретных путей.
8. **`Bash(npm install *)` и `Bash(npx skills *)` там же.** Снимают подтверждение с установки произвольных пакетов и скилов из интернета.
9. **7 MCP через `npx -y … @latest` / `uvx`.** Свежий код с npm/PyPI при каждом старте. Особенно `mcp-image` — короткое имя без скоупа.
10. **Профиль WSL мёртв с 19 апреля**, но хранит два MCP-сервера с ключами. Если WSL для Claude Code больше не нужен — вычистить `~/.claude.json` там целиком.

### 6.3 Функциональное — не безопасность, но сломано

11. **`ui-ux-pro-max` работает наполовину в обеих копиях** — `data/` и `scripts/` указывают на несуществующий `src/ui-ux-pro-max/`. Нужно либо переустановить скил целиком, либо принять, что доступен только текст SKILL.md без палитр и шрифтов.

---

## 7. Что НЕ найдено (проверено, отсутствует)

- Хуков в пользовательских настройках нет — ни в `~/.claude/settings.json`, ни в `./.claude/settings.local.json`, ни в WSL. Единственные хуки в системе — 4 плагинных из `remotion-superpowers`.
- `CLAUDE.md` отсутствует везде: `~/.claude/`, `D:\HBI_Studio_claude\`, WSL. Инструкций проекта у Claude нет.
- `./.mcp.json` в проекте отсутствует.
- statusline не настроен ни в одном профиле.
- Ни одного скила, обращающегося к сети, к `~/.ssh`, `.env` или credentials.
- Ни одной попытки prompt-injection или отключения подтверждений в текстах скилов.

---

---

## 8. Выполнено 2026-08-01 (с подтверждения владельца)

| Действие | Файл / путь | Результат |
|---|---|---|
| Удалён проектный дубль скила | `D:\HBI_Studio_claude\.claude\skills\ui-ux-pro-max\` | папка `skills` в проекте пуста, работает глобальная копия |
| Удалена локальная копия плагина 2.1.0 | `~\.claude\plugins\cache\remotion-superpowers\` | **все 4 автоматических хука убраны из системы**; остаётся inline-версия (21 использование) |
| Удалён marketplace-клон | `~\.claude\plugins\marketplaces\remotion-superpowers\` | — |
| Плагин снят с учёта | `~\.claude\settings.json` (`enabledPlugins`, `extraKnownMarketplaces`), `installed_plugins.json`, `known_marketplaces.json` | все три JSON валидны |
| Переписан description | `~\.claude\skills\ui-ux-pro-max\SKILL.md` | **916 → 350 символов** (−566 симв. ≈ −142 токена); убраны триггеры-пылесосы «build/review/fix/improve/optimize/refactor», добавлено явное «not for general code review or refactoring» |

Хуков в системе не осталось ни одного — ни пользовательских, ни плагинных.

Бэкап удалённого и изменённого: `…\Temp\claude\D--HBI-Studio-claude\ea6f7096-…\scratchpad\audit-backup\` (живёт до конца сессии).

**Изменения вступят в силу после перезапуска Claude Code.**

Не сделано (ожидает решения): перевыпуск ключей — владелец отказался, риск принят осознанно; снятие 4 неиспользуемых скилов; сужение permissions; отключение inline-плагинов; чистка профиля WSL.

---

*Аудит проводился в режиме только-чтение; изменения из раздела 8 внесены отдельно, после явного подтверждения.*
