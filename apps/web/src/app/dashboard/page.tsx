import {
  PageHeader,
  Separator,
  StatCard,
  RevenueChart,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@subfy/ui";
import {
  Users,
  TrendingDown,
  DollarSign,
  Wallet,
  LayoutGrid,
} from "lucide-react";

export default function DashboardOverview() {
  return (
    <div className="flex flex-col gap-7">
      {/* Page title */}
      <PageHeader
        title="Welcome User"
        subtitle="Manage your plans and subscriptions seamlessly."
      />

      <Separator />

      {/* Stat cards — Figma: 2 cols × 2 rows, 112px each, gap 28px */}
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Subscribers"
          value="1,453"
          trend="+15%"
          trendUp
        />
        <StatCard
          icon={TrendingDown}
          label="Churn Rate"
          value="5.8%"
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Revenue"
          value="$1,234"
          trend="+15%"
          trendUp
        />
        <StatCard
          icon={Wallet}
          label="Your Wallet"
          value="$4,567"
        />
      </div>

      {/* Revenue Overview chart */}
      <RevenueChart />

      {/* Tables — gap 28px */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        {/* Plans Overview */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>
              <LayoutGrid className="size-6 text-main-500" />
              <span>Plans Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>Plan</TableCell>
                    <TableCell>$9.99</TableCell>
                    <TableCell className="opacity-75">Monthly</TableCell>
                    <TableCell>
                      <Badge variant="active">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="primary" className="flex-1">
              Create Plan
            </Button>
            <Button variant="outline" className="flex-1">
              Use API
            </Button>
          </CardFooter>
        </Card>

        {/* Memberships Overview */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>
              <Users className="size-6 text-main-500" />
              <span>Memberships Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>Plan</TableCell>
                    <TableCell>$9.99</TableCell>
                    <TableCell className="opacity-75">Monthly</TableCell>
                    <TableCell>
                      <Badge variant="active">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="primary" className="flex-1">
              Manage your memberships
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
