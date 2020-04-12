/** @type {() => string} */
const html = String.raw;

self.render = (allTodos, todos, query) =>
	renderHeader(todos) +
	(allTodos.length
		? renderMain(allTodos, todos) + renderFooter(allTodos, query)
		: "");

const renderHeader = (todos) => html`
	<header class="header">
		<h1>todos</h1>
		<form action="/new" method="POST">
			<input
				name="title"
				class="new-todo"
				placeholder="What needs to be done?"
				${todos.some((t) => t.editing) ? "" : "autofocus"}
			/>
			<button type="submit" hidden>Add todo</button>
		</form>
	</header>
`;

const renderMain = (allTodos, todos) =>
	html`
		<section class="main">
			<form action="/toggle-all" method="POST">
				<button
					id="toggle-all"
					class="toggle-all ${allTodos.every((t) => t.completed)
						? "checked"
						: ""}"
					type="submit"
				></button>
				<label for="toggle-all">Mark all as complete</label>
			</form>
			<ul class="todo-list">
				${todos.map(renderTodo).join("")}
			</ul>
		</section>
	`;

const renderTodo = (todo) => html`
	<li
		class="${todo.completed ? "completed" : ""} ${todo.editing
			? "editing"
			: ""}"
	>
		<form action="/update" method="POST">
			<div class="view">
				<input name="id" type="hidden" value="${todo.id}" />
				<button hidden type="submit"></button>
				<input
					name="completed"
					class="toggle"
					type="checkbox"
					${todo.completed ? "checked" : ""}
					oninput="this.form.submit(); this.checked = !this.checked"
				/>
				<label ondblclick="this.nextElementSibling.click()"
					>${todo.title}</label
				>
				<button hidden formaction="/edit" type="submit"></button>
				<button class="destroy" formaction="/delete"></button>
			</div>
			<input
				name="title"
				class="edit"
				value="${todo.title}"
				${todo.editing ? "autofocus" : ""}
				onblur="this.form.submit()"
			/>
		</form>
	</li>
`;

const renderFooter = (allTodos, query) =>
	html`
		<footer class="footer">
			<span class="todo-count"
				><strong>${allTodos.filter((t) => !t.completed).length}</strong>
				item${allTodos.filter((t) => !t.completed).length === 1 ? "" : "s"}
				left</span
			>
			<ul class="filters">
				<li>
					<a ${query.has("filter") ? "" : 'class="selected"'} href="/">All</a>
				</li>
				<li>
					<a
						${query.get("filter") === "active" ? 'class="selected"' : ""}
						href="/?filter=active"
						>Active</a
					>
				</li>
				<li>
					<a
						${query.get("filter") === "completed" ? 'class="selected"' : ""}
						href="/?filter=completed"
						>Completed</a
					>
				</li>
			</ul>
			${allTodos.some((t) => t.completed)
				? html`
						<form action="/clear-completed" method="POST">
							<button type="submit" class="clear-completed">
								Clear completed
							</button>
						</form>
				  `
				: ""}
		</footer>
	`;
