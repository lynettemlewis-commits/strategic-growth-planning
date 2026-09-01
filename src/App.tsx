import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import CreateProject from "@/pages/CreateProject";
import Projects from "@/pages/Projects";
import EffortImpact from "@/pages/EffortImpact";
import PortfolioForecast from "@/pages/PortfolioForecast";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={CreateProject} />
        <Route path="/projects" component={Projects} />
        <Route path="/effort-impact" component={EffortImpact} />
        <Route path="/portfolio-forecast" component={PortfolioForecast} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
