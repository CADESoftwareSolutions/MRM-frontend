import { Card } from "@/components/ui/card";
import Layout from "../../components/Layout/Layout";
import Image from "next/image";

const ContactUs = () => {
  return (
    <Layout>
      <section
        className="flex min-h-screen items-center py-20"
        style={{
          background:
            "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <h1 className="mb-6 text-5xl font-bold text-white">
                Get in Touch
              </h1>

              <p className="mb-4 text-xl text-purple-200">
                We'd love to hear from you! Whether you have a question,
                feedback, or just want to say hello, our team is here.
              </p>

              <p className="mb-2 font-medium text-white">
                📧 Email:{" "}
                <span className="font-semibold text-[#e91e63]">
                  support@CADE.com
                </span>
              </p>

              <p className="font-medium text-white">
                📞 Phone:{" "}
                <span className="font-semibold text-[#e91e63]">
                  (555) 123-4567
                </span>
              </p>
            </div>

            <div>
              <Card className="overflow-hidden rounded-3xl shadow-2xl p-0">
                <Image
                  src="/images/ContactUs/ContactUs.png"
                  alt="Contact Us"
                  className="h-[400px] w-full object-cover"
                  width={200}
                  height={200}
                />
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContactUs;
