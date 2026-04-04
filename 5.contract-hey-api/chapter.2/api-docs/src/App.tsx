import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

const App = () => <SwaggerUI url="/output.yml" docExpansion="list" defaultModelsExpandDepth={1} />

export default App