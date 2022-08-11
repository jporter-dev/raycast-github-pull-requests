import { Octokit } from "@octokit/rest";
import { getPreferenceValues, showHUD } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { useEffect } from "react";

export type PullRequest = { title: string; url: string; tooltip: string; icon?: string };
export type PullRequestItems = {
  [key: string]: PullRequest[];
};
type PullRequestState = {
  reviewRequested: PullRequestItems;
  isLoading: boolean;
  total: number;
  failed?: boolean;
  failed_message?: string;
};

interface Preferences {
  token: string;
}

const preferences = getPreferenceValues<Preferences>();

const octokit = new Octokit({
  auth: preferences.token,
});

export const usePullRequests = () => {
  const [pullRequests, setPullRequests] = useCachedState<PullRequestState>("cache-prs", {
    reviewRequested: {},
    isLoading: true,
    total: 0,
    failed: true,
    failed_message: "",
  });

  useEffect(() => {
    (async () => {
      if (!preferences.token) {
        console.debug("INVALID OR MISSING TOKEN");
        setPullRequests({
          reviewRequested: {},
          isLoading: false,
          total: 0,
          failed: true,
          failed_message: "Missing or invalid token",
        });
        return;
      }

      const payload: PullRequestState = {
        reviewRequested: {},
        isLoading: false,
        total: 0,
        failed: false,
      };

      try {
        console.debug("Fetching PRs from GitHub...");

        const { data: pullRequests } = await octokit.rest.search.issuesAndPullRequests({
          q: "is:open is:pr review-requested:@me",
        });

        console.debug(`Found ${pullRequests.total_count} PRs`);

        payload.reviewRequested = pullRequests?.items?.reduce((acc: PullRequestItems, pr) => {
          const repo = pr.repository_url.split("repos/")[1];
          const openedAt = new Date(pr.created_at).toLocaleString();

          const title = `${pr.number}: ${pr.title}`;
          const url = pr.pull_request?.html_url ?? "";
          const tooltip = `Opened by ${pr.user?.login} on ${openedAt}`;
          const icon = pr.user?.avatar_url;

          acc[repo] = acc[repo] || [];
          acc[repo].push({
            title,
            url,
            tooltip,
            icon,
          });

          return acc;
        }, {});

        payload.total = pullRequests.total_count;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.debug("Unknown error: ", e);
        payload.failed = true;
        payload.failed_message = e.message ?? "Unknown error";
      }

      if (pullRequests.total !== payload.total) {
        const diff = payload.total - pullRequests.total;
        if (diff > 0) {
          const plural = diff > 1 ? "s" : "";
          console.debug(`${diff} new PR${plural} ready for review!`);
          showHUD(`${diff} new PR${plural} ready for review!`);
        }
      }

      setPullRequests(payload);
    })();
  }, []);

  return pullRequests;
};
