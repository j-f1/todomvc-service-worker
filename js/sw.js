///<reference lib="es2015"/>
///<reference lib="webworker.importscripts"/>
/** @typedef {{ id: number, title: string, completed: boolean, editing: boolean }} Todo */
importScripts("https://unpkg.com/localforage@1.7.3/dist/localforage.js");
importScripts("/js/template.js");
let render = null;
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open("v1")
			.then((cache) =>
				cache.addAll([
					"https://unpkg.com/todomvc-app-css@2.3.0/index.css",
					"https://unpkg.com/localforage@1.7.3/dist/localforage.js",
					"/index.html",
					"/css/app.css",
					"/js/sw.js",
					"/js/template.js",
					"/sw.js",
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

/** @typedef {(todos: readonly Todo[], formData: FormData) => void} FormHandler */
const handlePost = (
	/** @type {FetchEvent} */ event,
	/** @type {FormHandler} */ cb
) =>
	event.respondWith(
		Promise.all([getTodos(), event.request.formData()])
			.then(([todos, formData]) => cb(todos, formData))
			.then(
				() =>
					new Response("redirecting", {
						headers: { Location: "/" },
						status: 303,
					})
			)
	);

self.addEventListener("fetch", (event) => {
	const parsed = new URL(event.request.url);
	const route = parsed.pathname;
	if (route === "/") {
		event.respondWith(
			caches
				.match(event.request)
				.then((res) => res || fetch(event.request))
				.then((res) => Promise.all([res.text(), getTodos()]))
				.then(([html, todos]) =>
					pageRes(
						html
							.replace(
								'<script class="registration">',
								'<script class="registration ready">'
							)
							.replace(
								/<!-- app start -->.+?<!-- app end -->/,
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
		);
	} else if (route == "/new") {
		handlePost(event, (todos, formData) => {
			const title = formData.get("title").trim();
			if (title) {
				setTodos(
					todos.concat({
						id: String(Date.now()),
						completed: false,
						editing: false,
						title,
					})
				);
			}
		});
	} else if (route == "/edit") {
		handlePost(event, (todos, formData) =>
			setTodos(
				todos.map((t) =>
					t.id === formData.get("id") ? { ...t, editing: true } : t
				)
			)
		);
	} else if (route == "/update") {
		handlePost(event, (todos, formData) =>
			setTodos(
				todos.map((t) =>
					t.id === formData.get("id")
						? {
								id: t.id,
								completed: formData.has("completed"),
								editing: false,
								title: formData.get("commit") ? formData.get("title") : t.title,
						  }
						: t
				)
			)
		);
	} else if (route == "/delete") {
		handlePost(event, (todos, formData) =>
			setTodos(todos.filter((t) => t.id !== formData.get("id")))
		);
	} else if (route == "/clear-completed") {
		handlePost(event, (todos) => setTodos(todos.filter((t) => !t.completed)));
	} else if (route == "/toggle-all") {
		handlePost(event, (todos) =>
			setTodos(
				todos.every((t) => t.completed)
					? todos.map((t) => ({ ...t, completed: false }))
					: todos.map((t) => ({ ...t, completed: true }))
			)
		);
	} else {
		event.respondWith(
			caches.match(event.request).then((res) => res || fetch(event.request))
		);
	}
});
