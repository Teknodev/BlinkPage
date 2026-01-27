# 🚀 Cypress Automation Framework – BlinkPage

This project contains end-to-end UI automation tests for the **BlinkPage** web application using **Cypress** and **Page Object Model (POM)** design.

---

## 📌 Tech Stack

* **Cypress** – End-to-End Test Automation
* **JavaScript**
* **Page Object Model (POM)**
* **Webpack (via Cypress)**
* **Node.js**

---

## 📁 Project Structure

```
cypress/
├── e2e/
│   ├── login.cy.js
│   ├── signup.cy.js
│
├── support/
│   ├── common/
│   │   └── verifyTextField.js
│   │
│   ├── pages/
│   │   ├── loginPage.js
│   │   ├── signUpPage.js
│   │
│   ├── commands.js
│   └── e2e.js
│
cypress.config.js
package.json
README.md
```

---

## 🧱 Framework Design

### ✔ Page Object Model (POM)

* Each page has its own class
* All selectors and page-specific actions live in `pages/`
* Test files contain **only test logic**, not selectors

### ✔ Reusable Utilities

* Common validations like `verifyTextField()` are placed in `support/common`
* Reduces duplication and improves maintainability

---

## 🌍 Configuration

### Base URL

Configured in `cypress.config.js`:

```js
module.exports = defineConfig({
  e2e: {
    baseUrl: "https://app.blinkpage.app/",
  },
});
```

All navigation uses relative paths:

```js
cy.visit('/');
```

---

## 🧩 Example Page Object Usage

```js
loginPage.verifyHeader();
loginPage.verifyLandingBody();
loginPage.clickProfileIcon();
```

```js
verifyTextField(
  'input[name="email"]',
  {
    placeholder: "E-mail",
    value: "test@mail.com"
  },
  true,
  true
);
```

---

## ▶️ Running Tests

### Install Dependencies

```bash
npm install
```

### Open Cypress Test Runner

```bash
npx cypress open
```

### Run Tests in Headless Mode

```bash
npx cypress run
```

---

## 🧠 Best Practices Followed

* No hard waits (`cy.wait(time)`)
* Cypress-native retry mechanisms
* Stable selectors (prefer `name`, `type`, `alt`)
* No hard-coded URLs inside tests
* Clear separation of concerns
* Scalable and readable test structure

---

## 🔮 Future Enhancements

* API interception & mocking
* Negative test scenarios
* Data-driven testing
* CI/CD integration (GitHub Actions / GitLab CI)
* TypeScript support
* Accessibility testing

---

## 👤 Author

**Shah**
QA Automation Engineer
Cypress | UI Automation | Test Architecture
