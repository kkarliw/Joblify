import { test, expect } from "@playwright/test";

const NOW = new Date().toISOString();

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === "/api/jobs") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobs: [
            {
              id: "job-1",
              title: "Frontend Developer",
              description: "Construcción de interfaces",
              location: "Bogotá",
              modality: "REMOTO",
              type: "FULL_TIME",
              salaryMin: 4500,
              salaryMax: 6500,
              salaryCurrency: "USD",
              createdAt: NOW,
              poster: { id: "comp-1", name: "Acme" },
              skills: [],
            },
          ],
        }),
      });
      return;
    }

    if (path === "/api/users/public") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "u-1",
              name: "Ana Dev",
              role: "freelancer",
              headline: "Frontend Engineer",
              location: "Bogotá",
              profileCompletion: 82,
            },
          ],
        }),
      });
      return;
    }

    if (path === "/api/feed/public") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          posts: [
            {
              id: "p-1",
              content: "Bienvenidos a Joblify",
              createdAt: NOW,
              likesCount: 3,
              commentsCount: 1,
              author: { id: "a-1", name: "Comunidad", headline: "Equipo" },
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
});

test.describe("Suite pública/auth (43 casos)", () => {
  test("01 Landing: muestra hero principal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Conecta talento,\s*crece más rápido/i })).toBeVisible();
  });

  test("02 Landing: CTA principal dirige a registro", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Crear cuenta gratis" }).first().click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("03 Landing: CTA explora vacantes", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/vacantes"]').first().click();
    await expect(page).toHaveURL(/\/vacantes/);
  });

  test("04 Landing Navbar: Vacantes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Vacantes" }).first().click();
    await expect(page).toHaveURL(/\/vacantes/);
  });

  test("05 Landing Navbar: Freelancers", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Freelancers" }).first().click();
    await expect(page).toHaveURL(/\/freelancers/);
  });

  test("06 Landing Navbar: Comunidad", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Comunidad" }).first().click();
    await expect(page).toHaveURL(/\/comunidad/);
  });

  test("07 Landing Navbar: Para empresas", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Para empresas" }).first().click();
    await expect(page).toHaveURL(/\/empresa/);
  });

  test("08 Landing: al menos un CTA de registro visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Crear cuenta gratis" }).first()).toBeVisible();
  });

  test("09 Landing: metadata visible de marca", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Joblify/);
  });

  test("10 Landing: permite volver a home desde /vacantes con logo", async ({ page }) => {
    await page.goto("/vacantes");
    await page.getByRole("link", { name: "Joblify" }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("11 Login: heading principal", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Bienvenido de vuelta" })).toBeVisible();
  });

  test("12 Login: input email visible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("13 Login: input contraseña visible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  });

  test("14 Login: muestra error cuando API falla", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Credenciales inválidas" }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@example.com");
    await page.getByLabel("Contraseña").fill("12345678");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByTestId("login-error-banner")).toHaveText("Credenciales inválidas");
  });

  test("15 Login: valida contraseña corta", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@example.com");
    await page.getByLabel("Contraseña").fill("1234567");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByTestId("login-error-banner")).toHaveText("La contraseña debe tener mínimo 8 caracteres");
  });

  test("16 Login: link a forgot password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "¿Olvidaste?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("17 Login: link a registro", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Regístrate" }).click();
    await expect(page).toHaveURL(/\/register\/elegir/);
  });

  test("18 Login: botón Google visible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Google" })).toBeVisible();
  });

  test("19 Register: muestra heading crear cuenta", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Crea tu cuenta" })).toBeVisible();
  });

  test("20 Register: muestra opción Talento", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("Talento").first()).toBeVisible();
  });

  test("21 Register: muestra opción Empresa", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("Empresa").first()).toBeVisible();
  });

  test("22 RoleSelect register: muestra opción Freelancer", async ({ page }) => {
    await page.goto("/register/elegir");
    await expect(page.getByText("Freelancer").first()).toBeVisible();
  });

  test("23 RoleSelect register: muestra opción Emprendedor", async ({ page }) => {
    await page.goto("/register/elegir");
    await expect(page.getByText("Emprendedor").first()).toBeVisible();
  });

  test("24 RoleSelect register: muestra opción Estudiante", async ({ page }) => {
    await page.goto("/register/elegir");
    await expect(page.getByText("Estudiante").first()).toBeVisible();
  });

  test("25 Register: link a login/elegir", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Inicia sesión" }).first().click();
    await expect(page).toHaveURL(/\/login\?role=/);
  });

  test("26 Register elegir: heading", async ({ page }) => {
    await page.goto("/register/elegir");
    await expect(page.getByRole("heading", { name: "Crea tu cuenta" })).toBeVisible();
  });

  test("27 Login elegir: heading", async ({ page }) => {
    await page.goto("/login/elegir");
    await expect(page.getByRole("heading", { name: "Entra a Joblify" })).toBeVisible();
  });

  test("28 RoleSelect register: Talento", async ({ page }) => {
    await page.goto("/register/elegir");
    await expect(page.getByText("Talento").first()).toBeVisible();
  });

  test("29 RoleSelect register: Empresa", async ({ page }) => {
    await page.goto("/register/elegir");
    await expect(page.getByText("Empresa").first()).toBeVisible();
  });

  test("30 RoleSelect register: Freelancer", async ({ page }) => {
    await page.goto("/register/elegir");
    await expect(page.getByText("Freelancer").first()).toBeVisible();
  });

  test("31 RoleSelect register: Emprendedor", async ({ page }) => {
    await page.goto("/register/elegir");
    await expect(page.getByText("Emprendedor").first()).toBeVisible();
  });

  test("32 RoleSelect register: Estudiante", async ({ page }) => {
    await page.goto("/register/elegir");
    await expect(page.getByText("Estudiante").first()).toBeVisible();
  });

  test("33 Vacantes: heading", async ({ page }) => {
    await page.goto("/vacantes");
    await expect(page.getByRole("heading", { name: "Vacantes" })).toBeVisible();
  });

  test("34 Vacantes: buscador visible", async ({ page }) => {
    await page.goto("/vacantes");
    await expect(page.getByPlaceholder("Cargo, empresa o skill")).toBeVisible();
  });

  test("35 Vacantes: renderiza resultado mock", async ({ page }) => {
    await page.goto("/vacantes");
    await expect(page.getByText("Frontend Developer")).toBeVisible();
  });

  test("36 Freelancers: heading", async ({ page }) => {
    await page.goto("/freelancers");
    await expect(page.getByRole("heading", { name: "Freelancers" })).toBeVisible();
  });

  test("37 Freelancers: renderiza resultado mock", async ({ page }) => {
    await page.goto("/freelancers");
    await expect(page.getByText("Ana Dev")).toBeVisible();
  });

  test("38 Empresas: heading", async ({ page }) => {
    await page.goto("/empresa");
    await expect(page.getByRole("heading", { name: "Empresas" })).toBeVisible();
  });

  test("39 Empresas: renderiza empresa mock", async ({ page }) => {
    await page.goto("/empresa");
    await expect(page.getByText("Acme")).toBeVisible();
  });

  test("40 Comunidad: heading", async ({ page }) => {
    await page.goto("/comunidad");
    await expect(page.getByRole("heading", { name: "Comunidad" })).toBeVisible();
  });

  test("41 Comunidad: botón login navega", async ({ page }) => {
    await page.goto("/comunidad");
    await page.getByRole("link", { name: "Iniciar sesión para participar" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("42 Forgot password: envío exitoso", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("demo@example.com");
    await page.getByRole("button", { name: "Enviar instrucciones" }).click();
    await expect(page.getByRole("heading", { name: "Email enviado" })).toBeVisible();
  });

  test("43 Reset password sin token: link inválido", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Link invalido" })).toBeVisible();
  });
});
