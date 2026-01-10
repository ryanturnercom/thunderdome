export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold thunderdome-header mb-2">
          ENTER THE ARENA
        </h1>
        <p className="text-muted-foreground">
          Test your prompts against multiple LLMs in parallel
        </p>
      </div>

      <div className="thunderdome-panel p-6">
        <p className="text-center text-muted-foreground">
          Authentication required. Login page coming in Epic 2.
        </p>
      </div>
    </div>
  );
}
