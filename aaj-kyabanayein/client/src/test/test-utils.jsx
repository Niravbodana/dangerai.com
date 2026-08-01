import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/** Component test foundation — router wrapper */
export function renderWithRouter(ui, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
  );
}
