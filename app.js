const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server Running at http://localhost:3004/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const verifyRequestQueries = async (request, response, next) => {
  const { todoId, search_q, status, priority, category, date } = request.query;
  const priorityArray = ["HIGH", "MEDIUM", "LOW"];
  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryArray = ["WORK", "HOME", "LEARNING"];

  if (priority !== undefined) {
    if (priorityArray.includes(priority) === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    if (statusArray.includes(status) === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    if (categoryArray.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const givenDate = new Date(date);
      const formattedDate = format(givenDate, "yyyy-MM-dd");
      const requiredDate = toDate(
        new Date(
          `${givenDate.getFullYear()}-${
            givenDate.getMonth() + 1
          }-${givenDate.getDate()}`
        )
      );
      const isValidDate = await isValid(requiredDate);
      if (isValidDate === true) {
        request.date = date;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

const verifyRequestBodyQueries = async (request, response, next) => {
  const { id, status, priority, todo, category, dueDate } = request.body;
  const priorityArray = ["HIGH", "MEDIUM", "LOW"];
  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryArray = ["WORK", "HOME", "LEARNING"];

  if (priority !== undefined) {
    if (priorityArray.includes(priority) === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    if (statusArray.includes(status) === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    if (categoryArray.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const givenDate = new Date(dueDate);
      const formattedDate = format(givenDate, "yyyy-MM-dd");
      const requiredDate = toDate(
        new Date(
          `${givenDate.getFullYear()}-${
            givenDate.getMonth() + 1
          }-${givenDate.getDate()}`
        )
      );
      const isValidDate = await isValid(requiredDate);
      if (isValidDate === true) {
        request.dueDate = formattedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todo = todo;
  request.id = id;
  next();
};

//Get Todo API 1
app.get("/todos/", verifyRequestQueries, async (request, response) => {
  const {
    date,
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;
  const getTodoQuery = `
        SELECT
        id, todo, category, priority, status, due_date AS dueDate
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%'
        AND
        status LIKE '%${status}%'
        AND
        priority LIKE '%${priority}%'
        AND
        category LIKE '%${category}%';`;
  const todoArray = await db.all(getTodoQuery);
  response.send(todoArray);
});

//Get Todo API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT
        id, todo, category, priority, status, due_date AS dueDate
        FROM
        todo
        WHERE
        id = ${todoId};`;
  const todo = await db.all(getTodoQuery);
  response.send(todo[0]);
});

// GET Agenda API 3
app.get("/agenda/", verifyRequestQueries, async (request, response) => {
  const {
    date,
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;

  const givenDate = new Date(date);
  const formattedDate = format(givenDate, "yyyy-MM-dd");

  const getTodoQuery = `
        SELECT
        id, todo, category, priority, status, due_date AS dueDate
        FROM
        todo
        WHERE
        due_date = '${formattedDate}'
        AND
        todo LIKE '%${search_q}%'
        AND
        status LIKE '%${status}%'
        AND
        priority LIKE '%${priority}%'
        AND
        category LIKE '%${category}%';`;
  const todoArray = await db.all(getTodoQuery);
  response.send(todoArray);
});

//Post Todo API 4
app.post("/todos/", verifyRequestBodyQueries, async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request;
  console.log(id, todo, category, priority, status, dueDate);
  const postTodoQuery = `
    INSERT INTO
    todo(id, todo, priority, status, category, due_date)
    VALUES(
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
    );`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//Update Todo API 5
app.put(
  "/todos/:todoId/",
  verifyRequestBodyQueries,
  async (request, response) => {
    const { todoId } = request.params;
    const { status, priority, todo, category, dueDate } = request.body;
    let updateTodoQuery = "";
    let responseText = "";
    if (status !== undefined) {
      updateTodoQuery = `
        UPDATE
        todo
        SET
        status = '${status}'
        WHERE
        id = ${todoId};`;
      responseText = "Status Updated";
    } else if (priority !== undefined) {
      updateTodoQuery = `
        UPDATE
        todo
        SET
        priority = '${priority}'
        WHERE
        id = ${todoId};`;
      responseText = "Priority Updated";
    } else if (todo !== undefined) {
      updateTodoQuery = `
        UPDATE
        todo
        SET
        todo = '${todo}'
        WHERE
        id = ${todoId};`;
      responseText = "Todo Updated";
    } else if (category !== undefined) {
      updateTodoQuery = `
        UPDATE
        todo
        SET
        category = '${category}'
        WHERE
        id = ${todoId};`;
      responseText = "Category Updated";
    } else if (dueDate !== undefined) {
      const givenDate = new Date(dueDate);
      const formattedDate = format(givenDate, "yyyy-MM-dd");
      updateTodoQuery = `
        UPDATE
        todo
        SET
        due_date = '${formattedDate}'
        WHERE
        id = ${todoId};`;
      responseText = "Due Date Updated";
    }

    await db.run(updateTodoQuery);
    response.send(responseText);
  }
);

//Delete Todo API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE
    FROM
    todo
    WHERE
    id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
