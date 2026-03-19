import CreateAccountForm from "../../../components/Auth/CreateAccountForm";
import Layout from "../../../components/Layout/Layout";

const CreateAccountPage = () => (
  <Layout>
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <CreateAccountForm />
      </div>
    </div>
  </Layout>
);

export default CreateAccountPage;
