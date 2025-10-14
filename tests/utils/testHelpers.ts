import { Page } from "@playwright/test";
import { expect } from "playwright-test-coverage";
import { User, Role } from "../../src/service/pizzaService";

export async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    "d@jwt.com": {
      id: "3",
      name: "Kai Chen",
      email: "d@jwt.com",
      password: "a",
      roles: [{ role: Role.Diner }],
    },
    "f@jwt.com": {
      id: "4",
      name: "Oscar George",
      email: "f@jwt.com",
      password: "a",
      roles: [{ role: Role.Franchisee }],
    },
    "admin@jwt.com": {
      id: "5",
      name: "Alice Smith",
      email: "admin@jwt.com",
      password: "a",
      roles: [{ role: Role.Admin }],
    },
  };

  // Authorize login for the given user
  await page.route("*/**/api/auth", async (route) => {
    const method = route.request().method();

    if (method === "PUT") {
      // Handle login
      const loginReq = route.request().postDataJSON();
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
        return;
      }
      loggedInUser = validUsers[loginReq.email];
      const loginRes = { user: loggedInUser, token: "abcdef" };
      await route.fulfill({ json: loginRes });
    } else if (method === "DELETE") {
      // Handle logout
      loggedInUser = undefined;
      await route.fulfill({ json: { message: "Logged out" } });
    } else if (method === "POST") {
      // Handle register
      const registerReq = route.request().postDataJSON();
      if (validUsers[registerReq.email]) {
        await route.fulfill({
          status: 409,
          json: { error: "User already exists" },
        });
        return;
      }
      const user: User = {
        id: Math.floor(Math.random() * 10000).toString(),
        name: registerReq.name,
        email: registerReq.email,
        password: registerReq.password,
        roles: [{ role: Role.Diner }],
      };
      validUsers[user.email!] = user;
      loggedInUser = user;
      const registerRes = { user, token: "ghijkl" };
      await route.fulfill({ json: registerRes });
    }
  });

  // GET /api/user/me - Get current user
  await page.route("*/**/api/user/me", async (route) => {
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: loggedInUser });
  });

  // PUT /api/user/:userId - Update user
  // DELETE /api/user/:userId - Delete user
  await page.route(/\/api\/user\/\d+$/, async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const userId = url.match(/\/api\/user\/(\d+)/)?.[1];

    if (method === "PUT") {
      const updateReq = route.request().postDataJSON();
      // Update the logged in user with the new data
      if (loggedInUser) {
        const oldEmail = loggedInUser.email;

        loggedInUser = {
          ...loggedInUser,
          name: updateReq.name || loggedInUser.name,
          email: updateReq.email || loggedInUser.email,
          password: updateReq.password || loggedInUser.password,
        };

        if (oldEmail && validUsers[oldEmail]) {
          if (updateReq.email && updateReq.email !== oldEmail) {
            delete validUsers[oldEmail];
            validUsers[updateReq.email] = loggedInUser;
          } else {
            validUsers[oldEmail] = loggedInUser;
          }
        }
      }
      const updateRes = { user: loggedInUser, token: "updatedtoken" };
      await route.fulfill({ json: updateRes });
    } else if (method === "DELETE") {
      if (!loggedInUser || !loggedInUser.roles?.some(r => r.role === Role.Admin)) {
        await route.fulfill({ status: 403, json: { error: "Forbidden" } });
        return;
      }

      const userToDelete = Object.values(validUsers).find(u => u.id === userId);
      if (userToDelete && userToDelete.email) {
        delete validUsers[userToDelete.email];
        await route.fulfill({ json: { message: "user deleted" } });
      } else {
        await route.fulfill({ status: 404, json: { error: "User not found" } });
      }
    }
  });

  // GET /api/user - List all users (with or without query params)
  await page.route("*/**/api/user*", async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (url.includes('/api/user/me') || url.match(/\/api\/user\/\d+$/)) {
      return;
    }

    if (method === "GET") {
      // Check if user is logged in and is admin
      if (!loggedInUser) {
        await route.fulfill({ status: 401, json: { message: "unauthorized" } });
        return;
      }

      const isAdmin = loggedInUser.roles?.some(r => r.role === Role.Admin);
      if (!isAdmin) {
        await route.fulfill({ status: 403, json: { message: "unauthorized" } });
        return;
      }

      const urlObj = new URL(url);
      const pageNum = parseInt(urlObj.searchParams.get('page') || '0');
      const limit = parseInt(urlObj.searchParams.get('limit') || '10');
      const nameFilter = urlObj.searchParams.get('name') || '';

      let filteredUsers = Object.values(validUsers);
      if (nameFilter && nameFilter !== '*') {
        const filter = nameFilter.replace(/\*/g, '');
        filteredUsers = filteredUsers.filter(u =>
          u.name?.toLowerCase().includes(filter.toLowerCase())
        );
      }

      const start = pageNum * limit;
      const end = start + limit;
      const paginatedUsers = filteredUsers.slice(start, end);
      const more = end < filteredUsers.length;

      const users = paginatedUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        roles: u.roles,
      }));

      await route.fulfill({ json: { users, more } });
    }
  });

  // A standard menu
  await page.route("*/**/api/order/menu", async (route) => {
    const menuRes = [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
      {
        id: 2,
        title: "Pepperoni",
        image: "pizza2.png",
        price: 0.0042,
        description: "Spicy treat",
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: menuRes });
  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      const allFranchisesRes = {
        franchises: [
          {
            id: 2,
            name: "LotaPizza",
            stores: [
              { id: 4, name: "Lehi" },
              { id: 5, name: "Springville" },
              { id: 6, name: "American Fork" },
            ],
          },
          {
            id: 3,
            name: "PizzaCorp",
            stores: [{ id: 7, name: "Spanish Fork" }],
            admins: [{ id: "4", name: "Oscar George", email: "f@jwt.com" }],
          },
          { id: 4, name: "topSpot", stores: [] },
        ],
        more: false,
      };
      await route.fulfill({ json: allFranchisesRes });
    } else if (method === "POST") {
      const franchiseReq = route.request().postDataJSON();
      const franchiseRes = {
        ...franchiseReq,
        id: 4,
        stores: [],
      };
      await route.fulfill({ json: franchiseRes });
    }
  });

  // GET /api/franchise/:userId
  // DELETE /api/franchise/:franchiseId
  await page.route(/\/api\/franchise\/\d+$/, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      const userFranchisesRes = [
        {
          id: 3,
          name: "PizzaCorp",
          stores: [{ id: 7, name: "Spanish Fork" }],
          admins: [{ id: "4", name: "Oscar George", email: "f@jwt.com" }],
        },
      ];
      await route.fulfill({ json: userFranchisesRes });
    } else if (method === "DELETE") {
      const userDeleteFranchiseResponse = { message: "franchise deleted" };
      await route.fulfill({ json: userDeleteFranchiseResponse });
    }
  });

  // DELETE /api/franchise/:franchiseId/store/:storeId
  await page.route(/\/api\/franchise\/\d+\/store\/\d+$/, async (route) => {
    const method = route.request().method();
    if (method === "DELETE") {
      const userDeleteStoreResponse = { message: "store deleted" };
      await route.fulfill({ json: userDeleteStoreResponse });
    }
  });

  // POST /api/franchise/:franchiseId/store
  await page.route(/\/api\/franchise\/\d+\/store$/, async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const storeReq = route.request().postDataJSON();
      const storeRes = { ...storeReq, id: 8 };
      await route.fulfill({ json: storeRes });
    }
  });

  // Order a pizza.
  await page.route("*/**/api/order", async (route) => {
    const method = route.request().method();

    if (method === "POST") {
      const orderReq = route.request().postDataJSON();
      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: "eyJpYXQ",
      };
      await route.fulfill({ json: orderRes });
    } else if (method === "GET") {
      // Order history cannot be accessed if the user isn't logged in
      if (!loggedInUser) {
        throw new Error("Accessing user page without being logged in");
      }

      const orderHistoryRes = {
        dinerId: loggedInUser.id,
        orders: [
          {
            id: 1,
            franchiseId: 1,
            storeId: 1,
            date: "2024-06-05T05:14:40.000Z",
            items: [{ id: 1, menuId: 1, description: "Veggie", price: 0.05 }],
          },
        ],
        page: 1,
      };
      await route.fulfill({ json: orderHistoryRes });
    }
  });

  await page.goto("/");
}