///<reference lib="es2015"/>
///<reference lib="webworker"/>
/** @typedef {{ id: number, title: string, completed: boolean, editing: boolean }} Todo */
importScripts("https://unpkg.com/localforage@1.7.3/dist/localforage.js");
importScripts("/js/template.js");
const CACHE = "v1";
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) =>
				cache.addAll([
					"https://unpkg.com/todomvc-app-css@2.3.0/index.css",
					"https://unpkg.com/localforage@1.7.3/dist/localforage.js",
					"/index.html",
					"/css/app.css",
					"/js/sw.js",
					"/js/template.js",
				])
			)
	);
});

const pageRes = (body) =>
	new Response(body, {
		headers: { "Content-Type": "text/html" },
	});

/** @type {() => Promise<readonly Todo[]>} */
const getTodos = () =>
	localforage.getItem("todos").then((todos) => todos || []);
/** @type {(todos: readonly Todo[]) => Promise<void> */
const setTodos = (todos) => localforage.setItem("todos", todos);

const renderPage = (parsed) =>
	caches
		.match("/")
		.catch(() => null)
		.then((res) => res || fetch("/"))
		.then((res) => Promise.all([res.text(), getTodos()]))
		.then(([html, todos]) =>
			pageRes(
				html
					.replace(
						'<script class="registration">',
						'<script class="registration ready">'
					)
					.replace(
						/<!-- app start -->[\s\S]+?<!-- app end -->/,
						self.render(
							todos,
							todos.filter(
								parsed.searchParams.get("filter") === "active"
									? (t) => !t.completed
									: parsed.searchParams.get("filter") === "completed"
									? (t) => t.completed
									: () => true
							),
							parsed.searchParams
						)
					)
			)
		)
		.catch((err) => new Response(err.message + "\n" + err.stack));

self.addEventListener("fetch", (/** @type {FetchEvent} */ event) => {
	const parsed = new URL(event.request.url);
	if (parsed.pathname === "/" && parsed.host === location.host) {
		if (event.request.method === "POST") {
			event.respondWith(
				Promise.all([getTodos(), event.request.clone().text()])
					.then(([todos, body]) => {
						const params = new URLSearchParams(body);
						switch (params.get("action")) {
							case "new": {
								const title = params.get("title").trim();
								if (title) {
									return setTodos(
										todos.concat({
											id: String(Date.now()),
											completed: false,
											editing: false,
											title,
										})
									);
								}
								return;
							}
							case "edit":
								return setTodos(
									todos.map((t) =>
										t.id === params.get("id") ? { ...t, editing: true } : t
									)
								);

							case "rename":
								return setTodos(
									todos.map((t) =>
										t.id === params.get("id")
											? { ...t, editing: false, title: params.get("title") }
											: t
									)
								);

							case "complete":
								return setTodos(
									todos.map((t) =>
										t.id === params.get("id")
											? { ...t, completed: params.has("completed") }
											: t
									)
								);

							case "delete":
								return setTodos(todos.filter((t) => t.id !== params.get("id")));

							case "clear-completed":
								return setTodos(todos.filter((t) => !t.completed));

							case "toggle-all":
								return setTodos(
									todos.every((t) => t.completed)
										? todos.map((t) => ({ ...t, completed: false }))
										: todos.map((t) => ({ ...t, completed: true }))
								);
						}
					})
					.then(() => renderPage(parsed))
					.catch(
						async (err) =>
							new Response(
								err.message +
									"\n" +
									err.stack +
									"\n" +
									(await event.request.clone().text())
							)
					)
			);
		} else {
			event.respondWith(renderPage(parsed));
		}
	} else {
		event.respondWith(
			caches
				.match(event.request)
				.catch(() => null)
				.then((res) => res || fetch(event.request))
		);
		event.waitUntil(
			caches
				.open(CACHE)
				.then((cache) =>
					fetch(event.request).then((res) => cache.put(event.request, res))
				)
		);
	}
});
