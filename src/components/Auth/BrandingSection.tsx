
import React from "react";
import { Button } from "@/components/ui/button";

const BrandingSection: React.FC = () => {
  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-deep-blue"
          >
            <path d="M17 11V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8"></path>
            <path d="m12 12 4 4"></path>
            <path d="M20 12h-8"></path>
          </svg>
          <span className="text-2xl font-bold">RMS Pro</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-deep-blue to-brand-success-green bg-clip-text text-transparent mb-4">
          Swadeshi Solutions
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Efficiently manage your restaurant operations with our comprehensive restaurant management system. From table reservations to inventory tracking, we've got you covered.
        </p>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-brand-success-green/10 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-success-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Complete restaurant management</span>
          </div>
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-brand-warm-orange/10 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-warm-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Real-time analytics and reports</span>
          </div>
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-brand-deep-blue/10 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-deep-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Inventory and staff management</span>
          </div>
        </div>
        <Button 
          variant="link" 
          className="mt-8 p-0 text-brand-deep-blue hover:text-brand-deep-blue/90"
          onClick={() => window.open("https://swadeshisolutions.teleporthq.app", "_blank")}
        >
          Visit our website →
        </Button>
      </div>
    </div>
  );
};

export default BrandingSection;
