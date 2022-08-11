import { Fragment } from "react";
import { Color, Icon, MenuBarExtra, open, openExtensionPreferences } from "@raycast/api";
import { usePullRequests } from "./hooks/use-pull-requests";

export default function Command() {
  const { reviewRequested: reviewRequestedPRs, isLoading, total, failed, failed_message } = usePullRequests();
  const repos = Object.keys(reviewRequestedPRs);
  const tooltip = `You have ${total} open PRs requiring review`;

  if (failed)
    return (
      <MenuBarExtra
        icon={{
          source: "https://github.githubassets.com/favicons/favicon.png",
          tintColor: Color.Red,
        }}
        isLoading={isLoading}
        tooltip={failed_message}
      >
        <MenuBarExtra.Item title={failed_message ?? "Unknown Error"} icon={Icon.Warning} />
        <MenuBarExtra.Item title="Go to extension preferences" onAction={openExtensionPreferences} />
      </MenuBarExtra>
    );

  if (repos.length === 0)
    return (
      <MenuBarExtra
        icon={{
          source: "https://github.githubassets.com/favicons/favicon.png",
          tintColor: Color.Green,
        }}
        isLoading={isLoading}
        tooltip={tooltip}
      >
        <MenuBarExtra.Item title="No open PRs requiring review" icon={Icon.Check} />
      </MenuBarExtra>
    );

  return (
    <MenuBarExtra
      icon={{
        source: "https://github.githubassets.com/favicons/favicon.png",
        tintColor: Color.PrimaryText,
      }}
      isLoading={isLoading}
      title={total.toString()}
      tooltip={tooltip}
    >
      {repos.map((repo) => (
        <Fragment key={repo}>
          <MenuBarExtra.Item key={repo} title={repo} />
          {reviewRequestedPRs[repo].map((pr) => (
            <MenuBarExtra.Item
              key={pr.url}
              title={pr.title}
              tooltip={pr.tooltip}
              icon={pr.icon}
              onAction={() => open(pr.url)}
            />
          ))}
        </Fragment>
      ))}
    </MenuBarExtra>
  );
}
