$(async () => {
  // fetch
  let todos = [];
  let selectedId;

  try {
    todos = await fetchData();
  } catch (error) {
    showModal("error", "Cannot Fetch Data");

    // show message in browser if todos is empty
    toggleNoToDoMessage();
  }

  if (todos.length > 0) {
    displayTodo(todos);
  } else {
    // show no todo message
    toggleNoToDoMessage();
  }

  // listen for filter changes and update the displayed todos accordingly
  $("#filter").change((e) => {
    displayTodo(todos, e.target.value);
    $("#search").val("");
  });

  $("#search").on("input", (e) => {
    const searchQuery = e.target.value.toLowerCase();

    // Apply both search and filter criteria
    const filteredTodos = todos.filter((todo) => {
      const todoTextMatches = todo.todo?.toLowerCase().includes(searchQuery);

      // Check for filter value
      if ($("#filter").val() === "Pending") {
        return todoTextMatches && !todo.isCompleted; // Pending tasks that match the search
      } else {
        return todoTextMatches && todo.isCompleted; // Completed tasks that match the search
      }
    });

    // Display the filtered todos
    displayTodo(filteredTodos, $("#filter").val());
  });

  // use event delegation to prevet conflicts
  $("#todo-content-container").on("click", ".check", function (e) {
    const id = $(this).data("id");

    todos = todos.map((todo) => {
      if (todo.id == id) {
        todo.isCompleted = true;
      }
      return todo;
    });

    // add animation
    const container = $(`[data_parentid=${id}]`);

    container.animate(
      {
        right: "-150%",
      },
      200,
      () => {
        container.empty();
        container.animate({ height: 0, padding: 0 }, 300, () => {
          // Re-render the todos
          displayTodo(todos);
        });
      }
    );
  });
  $("#close-modal").click(() => {
    hideModal();
  });

  // use event delegation to prevet conflicts
  $("#todo-content-container").on("click", ".delete", function (e) {
    const id = $(this).data("id");

    todos = todos.filter((todo) => todo.id != id);

    const container = $(`[data_parentid=${id}]`)

    
    container.animate(
      {
        left: "-150%",
      },
      200,
      () => {
        container.empty();
        container.animate({ height: 0, padding: 0 }, 300, () => {
          // Re-render the todos
          displayTodo(todos, $("#filter").val());
        });
      }
    );


  });

  $("#add-btn").click((e) => {
    showAddModal();
  });

  // use event delegation for edit bu tton to prevent conflicts after re-rendering
  $("#todo-content-container").on("click", ".edit", function (e) {
    const id = $(this).data("id");
    const todo = todos.find((t) => t.id == id);

    if (todo) {
      selectedId = id;
      showEditModal(todo.todo); // open modal with the todo text
    }
  });

  $("#add-task-cancel").click(() => hideAddModal());

  $("#add-task-save")
    .off("click")
    .click(() => {
      console.log("called");

      const input = $("#new-task").val();

      if (input == "") {
        return;
      }

      const date = new Date().toISOString()

      const obj = {
        id: Math.floor(Math.random() * 1000), // this is for sample purposes this method in not adviosable
        date,
        todo: input,
        isCompleted: false,
      };      

      todos.unshift(obj);
      hideAddModal();
      $("#search").val("");
      $("#filter").val("Pending");

      displayTodo(todos, $("#filter").val());
    });

  $("#edit-task-cancel").click(() => {
    selectedId = null;
    hideEditModal();
  });

  $("#edit-task-save").click(() => {
    if ($("#edit-task").val() == "") {
      return;
    }

    todos = todos.map((todo) => {
      if (todo.id == selectedId) {
        todo.todo = $("#edit-task").val();
      }

      return todo;
    });

    hideEditModal();
    displayTodo(todos, $("#filter").val());
  });

  $("#close-modal").click(() => {
    hideModal();
  });
});

// =========================== start =================================
// functions

function showModal(type = "error", message = "No Message Provided") {
  let color = "#e60000";

  if (type == "success") {
    color = "#009900";
  }

  $("#modal").css({ display: "grid" });
  $(".modal-title").css({ color: color });
  $(".modal-text").text(message);
  $("#modal-wrapper").animate({ top: 0 }, 200);
}

function hideModal() {
  $("#modal-wrapper").animate({ top: -$(document).outerHeight() }, 200, () => {
    $(".modal-text").text("");
    $("#modal").css({ display: "none" });
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  return date.toLocaleString("en-US", options);
}

//   GET MEthod
function fetchData() {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: "./default_data.json",
      type: "GET",
      success: (response) => {
        resolve(response);
      },
      error: (error) => {
        reject([]);
      },
    });
  });
}

// display todo based on given filter
// display todo based on given filter
function displayTodo(todos, filter = "Pending") {
  $("#todo-content-container").empty();
  const filteredTodos = todos.filter((todo) => {
    if (filter == "Pending") {
      return !todo.isCompleted;
    } else {
      return todo.isCompleted;
    }
  });

  // If there are todos to show, hide the 'no-todo' message
  if (filteredTodos.length > 0) {
    toggleNoToDoMessage(true);
  } else {
    toggleNoToDoMessage(false);
  }

  // Loop through filtered todos and append them
  filteredTodos.forEach((todo) => {
    const todoContainer = $("<div></div>");
    todoContainer.attr({
      data_parentId: todo.id,
    });
    todoContainer.addClass("todo-container");
    todoContainer.html(`
        <div class="todo-info">
          <input type="checkbox" name="mark-as-done" class="check" ${
            todo.isCompleted && "checked"
          } ${todo.isCompleted && "disabled"} data-id=${todo.id}  />
          <div class="todo-details">
            <p class="todo-text ${todo.isCompleted && "done"}">${todo.todo}</p>
            <small class="todo-date">${formatDate(todo.date)}</small>
          </div>
        </div>
        <div class="todo-input">

        ${
          !todo.isCompleted
            ? ` <button class="edit" data-id=${todo.id}>
            <i class="fas fa-pencil" data-id=${todo.id}></i>
          </button>`
            : ""
        }

          <button class="delete" data-id="${todo.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `);

    $("#todo-content-container").append(todoContainer);
  });
}

// Function to toggle "No Todo" message visibility
function toggleNoToDoMessage(flag = false) {
  if (flag) {
    $("#no-todo").css({ display: "none" });
  } else {
    $("#no-todo").css({ display: "block" });
  }
}

function showAddModal() {
  $(".modal.add").css({ display: "grid" });
  $(".add-task-container").animate(
    {
      scale: 1,
    },
    200
  );
  $("#new-task").focus();
}
function hideAddModal() {
  $(".add-task-container").animate(
    {
      scale: 0,
    },
    200,
    () => {
      $(".modal.add").css({ display: "none" });
      $("#new-task").val("");
    }
  );
}

function showEditModal(text) {
  $(".modal.edit").css({ display: "grid" });
  $(".edit-task-container").animate(
    {
      scale: 1,
    },
    200,
    () => {
      $("#edit-task").focus();
      $("#edit-task").val(text);
    }
  );
}

function hideEditModal() {
  $(".edit-task-container").animate(
    {
      scale: 0,
    },
    200,
    () => {
      $(".modal.edit").css({ display: "none" });
      $("#edit-task").val("");
    }
  );
}
