import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  AlertTriangle, 
  Info, 
  Shield, 
  Clock,
  FileText,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { GeoComplianceCheck } from '@/types/compliance';
import { cn } from '@/lib/utils';

interface GeoComplianceNoticeProps {
  geoCheck: GeoComplianceCheck;
  className?: string;
}

export function GeoComplianceNotice({ geoCheck, className }: GeoComplianceNoticeProps) {
  const { region, regionName, canProceed, regionSpecificWarnings, regionSpecificRequirements, notices, restrictions, enhancedVerificationRequired, reportingRequired, estimatedProcessingTime } = geoCheck;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Region Header */}
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <Globe className="w-5 h-5 text-primary" />
        <div>
          <p className="font-medium">Destination Region: {regionName}</p>
          <p className="text-xs text-muted-foreground">Region: {region}</p>
        </div>
        <Badge variant={canProceed ? "default" : "destructive"} className="ml-auto">
          {canProceed ? 'Allowed' : 'Restricted'}
        </Badge>
      </div>

      {/* Processing Time */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Estimated processing time: {estimatedProcessingTime}</span>
      </div>

      {/* Restrictions */}
      {restrictions.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Restrictions</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {restrictions.map((restriction, index) => (
                <li key={index}>{restriction}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Requirements */}
      {regionSpecificRequirements.length > 0 && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Requirements</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {regionSpecificRequirements.map((requirement, index) => (
                <li key={index}>{requirement}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {regionSpecificWarnings.length > 0 && (
        <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">Warnings</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            <ul className="list-disc list-inside mt-2 space-y-1">
              {regionSpecificWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Notices */}
      {notices.length > 0 && (
        <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Important Notices</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <ul className="list-disc list-inside mt-2 space-y-1">
              {notices.map((notice, index) => (
                <li key={index}>{notice}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Verification Badge */}
      {enhancedVerificationRequired && (
        <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
          <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
            Enhanced verification required for this transfer
          </span>
        </div>
      )}

      {/* Reporting Required Badge */}
      {reportingRequired && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
          <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
            Regulatory reporting may be required
          </span>
        </div>
      )}

      {/* Success Message */}
      {canProceed && restrictions.length === 0 && regionSpecificWarnings.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Transfer complies with regional requirements
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for inline display
export function CompactGeoComplianceNotice({ geoCheck, className }: GeoComplianceNoticeProps) {
  const { regionName, canProceed, enhancedVerificationRequired, reportingRequired, estimatedProcessingTime } = geoCheck;

  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      <Globe className="w-4 h-4 text-muted-foreground" />
      <span className="text-muted-foreground">{regionName}</span>
      <Badge variant={canProceed ? "default" : "destructive"} className="text-xs">
        {canProceed ? 'Allowed' : 'Restricted'}
      </Badge>
      {enhancedVerificationRequired && (
        <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
          <Shield className="w-3 h-3 mr-1" />
          Enhanced Verification
        </Badge>
      )}
      {reportingRequired && (
        <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
          <FileText className="w-3 h-3 mr-1" />
          Reporting Required
        </Badge>
      )}
      <span className="text-xs text-muted-foreground ml-auto">
        <Clock className="w-3 h-3 inline mr-1" />
        {estimatedProcessingTime}
      </span>
    </div>
  );
}
