import {
  BarChart3,
  Building2,
  FileDown,
  Info,
  Plus,
  RotateCcw,
  Scale,
  Share2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { compareAssetScenario } from "../domain/cgt/calculator";
import { calculateNegativeGearing } from "../domain/cgt/negativeGearing";
import type { Asset, AssetKind, SaleScenario, TaxProfile } from "../domain/cgt/types";
import { appAssumptions, policySources } from "../data/policySources";
import {
  clearPortfolioState,
  loadPortfolioState,
  savePortfolioState,
  type PortfolioState,
} from "../data/portfolioStorage";
import { assetKindLabel, money, percent } from "./format";

type Screen = "Portfolio" | "Scenarios" | "Compare" | "Assumptions" | "Sources";

const screens: Screen[] = ["Portfolio", "Scenarios", "Compare", "Assumptions", "Sources"];

const scenarioPresets = [
  { label: "Before reform", saleDate: "2027-06-15", cpiAtSale: 131, income: 150_000 },
  { label: "Base FY2028", saleDate: "2028-09-01", cpiAtSale: 139, income: 150_000 },
  { label: "High income", saleDate: "2028-09-01", cpiAtSale: 139, income: 230_000 },
  { label: "Low income", saleDate: "2028-09-01", cpiAtSale: 139, income: 35_000 },
  { label: "Low CPI", saleDate: "2029-09-01", cpiAtSale: 140, income: 150_000 },
  { label: "High CPI", saleDate: "2029-09-01", cpiAtSale: 151, income: 150_000 },
];

export function App() {
  const [screen, setScreen] = useState<Screen>("Portfolio");
  const [state, setState] = useState<PortfolioState>(() => loadPortfolioState());
  const selectedAsset = state.assets.find((asset) => asset.id === state.scenario.assetId) ?? state.assets[0];

  useEffect(() => {
    savePortfolioState(state);
  }, [state]);

  const scenario = useMemo(() => {
    if (!selectedAsset) {
      return null;
    }

    return compareAssetScenario(selectedAsset, state.scenario, state.profile);
  }, [selectedAsset, state.profile, state.scenario]);

  function updateProfile(patch: Partial<TaxProfile>) {
    setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  }

  function updateScenario(patch: Partial<SaleScenario>) {
    setState((current) => ({ ...current, scenario: { ...current.scenario, ...patch } }));
  }

  function updateAsset(assetId: string, patch: Partial<Asset>) {
    setState((current) => ({
      ...current,
      assets: current.assets.map((asset) => (asset.id === assetId ? { ...asset, ...patch } : asset)),
    }));
  }

  function addAsset(kind: AssetKind) {
    const id = `${kind}-${Date.now()}`;
    const asset: Asset = {
      id,
      kind,
      name: kind === "share_parcel" ? "New share parcel" : "New investment property",
      acquisitionDate: "2024-07-01",
      ownershipShare: 1,
      costBase: kind === "share_parcel" ? 50_000 : 750_000,
      currentValue: kind === "share_parcel" ? 65_000 : 800_000,
      valueAtPolicyStart: kind === "share_parcel" ? 72_000 : 840_000,
      isEligibleNewBuild: false,
      annualRent: kind === "residential_property" ? 34_000 : undefined,
      loanBalance: kind === "residential_property" ? 650_000 : undefined,
      interestRate: kind === "residential_property" ? 0.065 : undefined,
      annualInterest: kind === "residential_property" ? 42_000 : undefined,
      annualDeductibleExpenses: kind === "residential_property" ? 7_000 : undefined,
      annualDepreciation: kind === "residential_property" ? 3_000 : undefined,
    };

    setState((current) => ({
      ...current,
      assets: [...current.assets, asset],
      scenario: { ...current.scenario, assetId: id, saleProceeds: asset.currentValue },
    }));
  }

  function removeAsset(assetId: string) {
    setState((current) => {
      const assets = current.assets.filter((asset) => asset.id !== assetId);
      return {
        ...current,
        assets,
        scenario: {
          ...current.scenario,
          assetId: current.scenario.assetId === assetId ? assets[0]?.id ?? "" : current.scenario.assetId,
        },
      };
    });
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">CGT</div>
          <div>
            <strong>Impact Calculator</strong>
            <span>Australian resident MVP</span>
          </div>
        </div>
        <nav className="nav">
          {screens.map((item) => (
            <button key={item} className={screen === item ? "active" : ""} onClick={() => setScreen(item)}>
              {item === "Portfolio" && <Building2 size={17} />}
              {item === "Scenarios" && <Scale size={17} />}
              {item === "Compare" && <BarChart3 size={17} />}
              {item === "Assumptions" && <Info size={17} />}
              {item === "Sources" && <Share2 size={17} />}
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebarNote">
          Local-only MVP. Figures are estimates for accountant/adviser discussion, not tax advice.
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">2026-27 Budget reform modeller</p>
            <h1>{screen}</h1>
            <p>Compare current CGT settings against announced post-1 July 2027 reform rules.</p>
          </div>
          <div className="toolbar">
            <button className="iconButton" title="Print or save scenario summary" onClick={() => window.print()}>
              <FileDown size={17} />
            </button>
            <button
              className="iconButton"
              title="Reset sample workspace"
              onClick={() => setState(clearPortfolioState())}
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </header>

        {screen === "Portfolio" && (
          <PortfolioScreen
            assets={state.assets}
            scenario={state.scenario}
            profile={state.profile}
            onAdd={addAsset}
            onSelect={(assetId) => updateScenario({ assetId })}
            onRemove={removeAsset}
          />
        )}
        {screen === "Scenarios" && selectedAsset && scenario && (
          <ScenarioScreen
            asset={selectedAsset}
            assets={state.assets}
            profile={state.profile}
            scenario={state.scenario}
            result={scenario}
            onProfileChange={updateProfile}
            onScenarioChange={updateScenario}
            onAssetChange={(patch) => updateAsset(selectedAsset.id, patch)}
          />
        )}
        {screen === "Compare" && selectedAsset && (
          <CompareScreen asset={selectedAsset} scenario={state.scenario} profile={state.profile} />
        )}
        {screen === "Assumptions" && (
          <AssumptionsScreen profile={state.profile} onProfileChange={updateProfile} />
        )}
        {screen === "Sources" && <SourcesScreen />}
      </main>
    </div>
  );
}

function PortfolioScreen({
  assets,
  scenario,
  profile,
  onAdd,
  onSelect,
  onRemove,
}: {
  assets: Asset[];
  scenario: SaleScenario;
  profile: TaxProfile;
  onAdd: (kind: AssetKind) => void;
  onSelect: (assetId: string) => void;
  onRemove: (assetId: string) => void;
}) {
  return (
    <section className="screenPanel">
      <div className="panelHeader">
        <div>
          <h2>Portfolio workspace</h2>
          <p>Assets stay in this browser. Select a row to drive the scenario and compare screens.</p>
        </div>
        <div className="toolbar">
          <button onClick={() => onAdd("residential_property")}>
            <Plus size={16} /> Property
          </button>
          <button onClick={() => onAdd("share_parcel")}>
            <Plus size={16} /> Share parcel
          </button>
        </div>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Type</th>
              <th>Acquired</th>
              <th>Cost base</th>
              <th>Current value</th>
              <th>Unrealised gain</th>
              <th>Reform exposure</th>
              <th>Negative gearing</th>
              <th>Next action</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const comparison = compareAssetScenario(asset, { ...scenario, assetId: asset.id }, profile);
              const ng = comparison.negativeGearing;
              return (
                <tr key={asset.id} className={scenario.assetId === asset.id ? "selectedRow" : ""}>
                  <td>
                    <button className="linkButton" onClick={() => onSelect(asset.id)}>
                      {asset.name}
                    </button>
                    <div className="muted">{percent(asset.ownershipShare)} owned</div>
                  </td>
                  <td>{assetKindLabel(asset.kind)}</td>
                  <td>{asset.acquisitionDate}</td>
                  <td>{money(asset.costBase * asset.ownershipShare)}</td>
                  <td>{money(asset.currentValue * asset.ownershipShare)}</td>
                  <td>{money((asset.currentValue - asset.costBase) * asset.ownershipShare)}</td>
                  <td>
                    <ExposureBadges asset={asset} result={comparison} />
                  </td>
                  <td>
                    <span className={`badge ${ng.status === "quarantined" ? "danger" : "neutral"}`}>
                      {ng.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>
                    <button className="iconButton" title="Delete asset" onClick={() => onRemove(asset.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ScenarioScreen({
  asset,
  assets,
  profile,
  scenario,
  result,
  onProfileChange,
  onScenarioChange,
  onAssetChange,
}: {
  asset: Asset;
  assets: Asset[];
  profile: TaxProfile;
  scenario: SaleScenario;
  result: ReturnType<typeof compareAssetScenario>;
  onProfileChange: (patch: Partial<TaxProfile>) => void;
  onScenarioChange: (patch: Partial<SaleScenario>) => void;
  onAssetChange: (patch: Partial<Asset>) => void;
}) {
  return (
    <div className="scenarioGrid">
      <section className="screenPanel">
        <div className="panelHeader">
          <h2>Inputs</h2>
        </div>
        <div className="formGrid">
          <label>
            Asset
            <select value={scenario.assetId} onChange={(event) => onScenarioChange({ assetId: event.target.value })}>
              {assets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input value={asset.name} onChange={(event) => onAssetChange({ name: event.target.value })} />
          </label>
          <label>
            Acquisition date
            <input type="date" value={asset.acquisitionDate} onChange={(event) => onAssetChange({ acquisitionDate: event.target.value })} />
          </label>
          <label>
            Cost base
            <MoneyInput value={asset.costBase} onChange={(costBase) => onAssetChange({ costBase })} />
          </label>
          <label>
            Current value
            <MoneyInput value={asset.currentValue} onChange={(currentValue) => onAssetChange({ currentValue })} />
          </label>
          <label>
            1 July 2027 value
            <MoneyInput value={asset.valueAtPolicyStart ?? 0} onChange={(valueAtPolicyStart) => onAssetChange({ valueAtPolicyStart })} />
          </label>
          <label>
            Sale date
            <input type="date" value={scenario.saleDate} onChange={(event) => onScenarioChange({ saleDate: event.target.value })} />
          </label>
          <label>
            Expected sale price
            <MoneyInput value={scenario.saleProceeds} onChange={(saleProceeds) => onScenarioChange({ saleProceeds })} />
          </label>
          <label>
            Selling costs
            <MoneyInput value={scenario.sellingCosts} onChange={(sellingCosts) => onScenarioChange({ sellingCosts })} />
          </label>
          <label>
            Ownership share
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={asset.ownershipShare}
              onChange={(event) => onAssetChange({ ownershipShare: Number(event.target.value) })}
            />
          </label>
          <label>
            Non-CGT taxable income
            <MoneyInput
              value={profile.nonCgtTaxableIncome}
              onChange={(nonCgtTaxableIncome) => onProfileChange({ nonCgtTaxableIncome })}
            />
          </label>
          <label>
            Carried-forward losses
            <MoneyInput
              value={profile.carriedForwardCapitalLosses}
              onChange={(carriedForwardCapitalLosses) => onProfileChange({ carriedForwardCapitalLosses })}
            />
          </label>
          <label>
            CPI at acquisition
            <NumberInput value={scenario.cpiAtAcquisition} onChange={(cpiAtAcquisition) => onScenarioChange({ cpiAtAcquisition })} />
          </label>
          <label>
            CPI at 1 July 2027
            <NumberInput value={scenario.cpiAtPolicyStart} onChange={(cpiAtPolicyStart) => onScenarioChange({ cpiAtPolicyStart })} />
          </label>
          <label>
            CPI at sale
            <NumberInput value={scenario.cpiAtSale} onChange={(cpiAtSale) => onScenarioChange({ cpiAtSale })} />
          </label>
          {asset.kind === "residential_property" && (
            <>
              <label>
                Annual rent
                <MoneyInput value={asset.annualRent ?? 0} onChange={(annualRent) => onAssetChange({ annualRent })} />
              </label>
              <label>
                Loan balance
                <MoneyInput value={asset.loanBalance ?? 0} onChange={(loanBalance) => onAssetChange({ loanBalance })} />
              </label>
              <label>
                Interest rate
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.001"
                  value={asset.interestRate ?? 0}
                  onChange={(event) => onAssetChange({ interestRate: Number(event.target.value) })}
                />
              </label>
              <label>
                Annual interest
                <MoneyInput value={asset.annualInterest ?? 0} onChange={(annualInterest) => onAssetChange({ annualInterest })} />
              </label>
              <label>
                Deductible expenses
                <MoneyInput
                  value={asset.annualDeductibleExpenses ?? 0}
                  onChange={(annualDeductibleExpenses) => onAssetChange({ annualDeductibleExpenses })}
                />
              </label>
              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={asset.isEligibleNewBuild ?? false}
                  onChange={(event) => onAssetChange({ isEligibleNewBuild: event.target.checked })}
                />
                Eligible new build
              </label>
            </>
          )}
          <label className="checkboxLabel">
            <input
              type="checkbox"
              checked={profile.receivesIncomeSupport}
              onChange={(event) => onProfileChange({ receivesIncomeSupport: event.target.checked })}
            />
            Income-support minimum-tax exemption
          </label>
        </div>
      </section>

      <section className="screenPanel">
        <div className="panelHeader">
          <h2>Current vs reform</h2>
          <Delta value={result.taxDelta} />
        </div>
        <div className="metricsGrid">
          <Metric label="Current taxable gain" value={money(result.current.taxableGain)} />
          <Metric label="Reform taxable gain" value={money(result.reform.taxableGain)} />
          <Metric label="Current tax on gain" value={money(result.current.totalTax)} />
          <Metric label="Reform tax on gain" value={money(result.reform.totalTax)} />
          <Metric label="Minimum-tax top-up" value={money(result.reform.minimumTaxTopUp)} />
          <Metric label="After-tax proceeds delta" value={money(result.proceedsDelta)} intent={result.proceedsDelta >= 0 ? "good" : "bad"} />
        </div>
        <div className="waterfall">
          <div>
            <span>Net proceeds</span>
            <strong>{money(result.reform.netProceeds)}</strong>
          </div>
          <div>
            <span>Pre-2027 taxable gain</span>
            <strong>{money(result.reform.prePolicyTaxableGain ?? 0)}</strong>
          </div>
          <div>
            <span>Post-2027 real gain</span>
            <strong>{money(result.reform.postPolicyRealGain ?? result.reform.taxableGain)}</strong>
          </div>
          <div>
            <span>Ordinary marginal tax</span>
            <strong>{money(result.reform.ordinaryTax)}</strong>
          </div>
          <div>
            <span>30% minimum top-up</span>
            <strong>{money(result.reform.minimumTaxTopUp)}</strong>
          </div>
        </div>
      </section>

      <aside className="screenPanel inspector">
        <div className="panelHeader">
          <h2>Explanation</h2>
        </div>
        <p className="callout">{result.reform.method}</p>
        {result.reform.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
        <hr />
        <p className="callout">{result.negativeGearing.status.replaceAll("_", " ")}</p>
        <p>{result.negativeGearing.explanation}</p>
        <dl>
          <dt>Net rental result</dt>
          <dd>{money(result.negativeGearing.netRentalResult)}</dd>
          <dt>Quarantined loss</dt>
          <dd>{money(result.negativeGearing.quarantinedLoss)}</dd>
        </dl>
      </aside>
    </div>
  );
}

function CompareScreen({ asset, scenario, profile }: { asset: Asset; scenario: SaleScenario; profile: TaxProfile }) {
  return (
    <section className="screenPanel">
      <div className="panelHeader">
        <div>
          <h2>Scenario comparison</h2>
          <p>{asset.name}: sale timing, income, and CPI sensitivity.</p>
        </div>
      </div>
      <div className="comparisonGrid">
        {scenarioPresets.map((preset) => {
          const nextScenario = { ...scenario, saleDate: preset.saleDate, cpiAtSale: preset.cpiAtSale };
          const nextProfile = { ...profile, nonCgtTaxableIncome: preset.income };
          const result = compareAssetScenario(asset, nextScenario, nextProfile);
          return (
            <article className="scenarioCard" key={preset.label}>
              <div className="scenarioCardHead">
                <h3>{preset.label}</h3>
                <Delta value={result.taxDelta} />
              </div>
              <dl>
                <dt>Sale date</dt>
                <dd>{preset.saleDate}</dd>
                <dt>Non-CGT income</dt>
                <dd>{money(preset.income)}</dd>
                <dt>Current tax</dt>
                <dd>{money(result.current.totalTax)}</dd>
                <dt>Reform tax</dt>
                <dd>{money(result.reform.totalTax)}</dd>
                <dt>Minimum top-up</dt>
                <dd>{money(result.reform.minimumTaxTopUp)}</dd>
                <dt>After-tax proceeds</dt>
                <dd>{money(result.reform.afterTaxProceeds)}</dd>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AssumptionsScreen({
  profile,
  onProfileChange,
}: {
  profile: TaxProfile;
  onProfileChange: (patch: Partial<TaxProfile>) => void;
}) {
  return (
    <section className="screenPanel twoColumn">
      <div>
        <div className="panelHeader">
          <h2>Tax profile</h2>
        </div>
        <div className="formGrid compact">
          <label>
            Residency
            <select value={profile.residency} onChange={(event) => onProfileChange({ residency: event.target.value as TaxProfile["residency"] })}>
              <option value="australian_resident">Australian resident</option>
              <option value="foreign_resident">Foreign resident (not modelled)</option>
            </select>
          </label>
          <label>
            Ownership entity
            <select
              value={profile.ownershipEntity}
              onChange={(event) => onProfileChange({ ownershipEntity: event.target.value as TaxProfile["ownershipEntity"] })}
            >
              <option value="individual">Individual</option>
              <option value="joint_individuals">Joint individuals (not modelled)</option>
              <option value="trust">Trust (later)</option>
              <option value="company">Company (later)</option>
              <option value="smsf">SMSF (later)</option>
            </select>
          </label>
        </div>
      </div>
      <div>
        <div className="panelHeader">
          <h2>Calculation assumptions</h2>
        </div>
        <ul className="assumptionList">
          {appAssumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SourcesScreen() {
  return (
    <section className="screenPanel">
      <div className="panelHeader">
        <div>
          <h2>Sources and unresolved details</h2>
          <p>Last researched in repo docs: 24 May 2026.</p>
        </div>
      </div>
      <div className="sourceList">
        {policySources.map((source) => (
          <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
            <strong>{source.label}</strong>
            <span>{source.note}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function ExposureBadges({ asset, result }: { asset: Asset; result: ReturnType<typeof compareAssetScenario> }) {
  const badges = [];
  if (asset.kind === "residential_property" && asset.acquisitionDate <= "2026-05-12") {
    badges.push("Grandfathered property");
  }
  if (asset.acquisitionDate < "2027-07-01") {
    badges.push("Post-2027 split");
  }
  if (asset.isEligibleNewBuild) {
    badges.push("New build choice");
  }
  if (result.reform.minimumTaxTopUp > 0) {
    badges.push("Minimum-tax risk");
  }
  if (!asset.valueAtPolicyStart && asset.acquisitionDate < "2027-07-01") {
    badges.push("Needs 1 July value");
  }

  return (
    <div className="badgeStack">
      {(badges.length ? badges : ["Low exposure"]).map((badge) => (
        <span className="badge" key={badge}>
          {badge}
        </span>
      ))}
    </div>
  );
}

function Metric({ label, value, intent }: { label: string; value: string; intent?: "good" | "bad" }) {
  return (
    <div className={`metric ${intent ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Delta({ value }: { value: number }) {
  const intent = value > 0 ? "bad" : value < 0 ? "good" : "neutral";
  return <span className={`delta ${intent}`}>{value === 0 ? "No tax delta" : `${value > 0 ? "+" : ""}${money(value)}`}</span>;
}

function MoneyInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <input type="number" min="0" step="1000" value={value} onChange={(event) => onChange(Number(event.target.value))} />;
}

function NumberInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <input type="number" min="0" step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value))} />;
}
