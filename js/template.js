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
		<form method="POST">
			<input type="hidden" name="action" value="new" />
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
			<form method="POST">
				<input type="hidden" name="action" value="toggle-all" />
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
		<div class="view">
			<form method="POST">
				<input name="id" type="hidden" value="${todo.id}" />
				<input type="hidden" name="action" value="complete" />
				<input
					name="completed"
					class="toggle"
					type="checkbox"
					${todo.completed ? "checked" : ""}
					oninput="this.form.submit(); this.checked = !this.checked"
				/>
				<label ondblclick="this.parentNode.nextElementSibling.submit()"
					>${todo.title}</label
				>
			</form>
			<form method="POST">
				<input name="id" type="hidden" value="${todo.id}" />
				<input type="hidden" name="action" value="edit" />
			</form>
			<form method="POST">
				<input name="id" type="hidden" value="${todo.id}" />
				<input type="hidden" name="action" value="delete" />
				<button class="destroy"></button>
			</form>
		</div>
		${todo.editing
			? html`
					<form method="POST">
						<input name="id" type="hidden" value="${todo.id}" />
						<input type="hidden" name="action" value="rename" />
						<input
							name="title"
							class="edit"
							value="${todo.title}"
							autofocus
							onblur="this.form.submit()"
						/>
					</form>
			  `
			: ""}
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
						<form method="POST">
							<input type="hidden" name="action" value="clear-completed" />
							<button type="submit" class="clear-completed">
								Clear completed
							</button>
						</form>
				  `
				: ""}
		</footer>
	`;
