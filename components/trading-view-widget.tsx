"use client";
import useTradingViewWidget from "@/hooks/use-trading-view-widget";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface TradingViewWidgetProps {
  title?: string;
  scriptUrl: string;
  config: Record<string, unknown>;
  height?: number;
  className?: string;
}

const TradingViewWidget = ({
  title,
  scriptUrl,
  config,
  height = 600,
  className,
}: TradingViewWidgetProps) => {
  const container = useTradingViewWidget({
    scriptUrl: scriptUrl,
    config: config,
    height: height,
  });

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-5 text-gray-100 text-2xl font-semibold">{title}</h2>
      )}
      <div
        className={cn("tradingview-widget-container", className)}
        ref={container}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: height, width: "100%" }}
        />
      </div>
    </div>
  );
};

export default memo(TradingViewWidget);
