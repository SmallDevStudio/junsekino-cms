import LoginForm from "@/components/admin/auth/LoginForm";

import { requireGuest } from "@/lib/auth/guards";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  await requireGuest();

  return (
    <main
      className="
        grid
        min-h-screen
        bg-white
        lg:grid-cols-2
      "
    >
      <section
        className="
          hidden
          bg-neutral-950
          p-12
          text-white
          lg:flex
          lg:flex-col
          lg:justify-between
        "
      >
        <div>
          <div
            className="
              text-xl
              font-semibold
              tracking-tight
            "
          >
            Junsekino
          </div>
        </div>

        <div className="max-w-lg">
          <h1
            className="
              text-5xl
              font-medium
              leading-tight
              tracking-tight
            "
          >
            Content,
            <br />
            thoughtfully managed.
          </h1>

          <p
            className="
              mt-6
              max-w-md
              text-sm
              leading-6
              text-neutral-400
            "
          >
            Multi-company content management platform for Junsekino.
          </p>
        </div>

        <div
          className="
            text-xs
            text-neutral-600
          "
        >
          JUNSEKINO CMS
        </div>
      </section>

      <section
        className="
          flex
          min-h-screen
          items-center
          justify-center
          px-6
          py-12
          sm:px-10
        "
      >
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <div
              className="
                mb-12
                text-xl
                font-semibold
                tracking-tight
              "
            >
              Junsekino
            </div>
          </div>

          <div>
            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-[0.2em]
                text-neutral-400
              "
            >
              Administration
            </p>

            <h2
              className="
                mt-3
                text-3xl
                font-semibold
                tracking-tight
                text-neutral-950
              "
            >
              Welcome back
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-neutral-500
              "
            >
              Sign in to manage Junsekino content.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p
            className="
              mt-8
              text-center
              text-xs
              text-neutral-400
            "
          >
            Authorized personnel only.
          </p>
        </div>
      </section>
    </main>
  );
}
