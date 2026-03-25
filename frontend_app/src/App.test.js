import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders live dashboard", async () => {
  render(<App />);
  // Sidebar should include Live Dashboard link text for all roles.
  const nav = await screen.findByText(/Live Dashboard/i);
  expect(nav).toBeInTheDocument();
});
