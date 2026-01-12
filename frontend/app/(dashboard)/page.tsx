import { PageTitle2 } from "@/components/page-title"
import EchoLoader from '@/components/echo-loader';


export default function Page() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <PageTitle2 />
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min flex items-center justify-center flex-col gap-4" >
                <EchoLoader size={64} />
                <h1 className="text-xl font-semibold">Under Construction</h1>
            </div>
        </div>
    );
}