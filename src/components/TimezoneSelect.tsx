import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { getAvailableTimezones } from '../utils/dateUtils';
import type { CountryTimezone } from '../utils/dateUtils';

interface TimezoneSelectProps {
  value: string;
  onChange: (zone: string) => void;
}

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const allZones = getAvailableTimezones();
  
  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync search query when value changes or dropdown opens
  useEffect(() => {
    const selectedZone = allZones.find(z => z.value === value);
    setSearchQuery(selectedZone ? selectedZone.label : value);
  }, [value, isOpen]);

  const filteredZones = searchQuery
    ? allZones.filter(z => 
        z.searchText.includes(searchQuery.toLowerCase())
      )
    : allZones;

  // Group filtered results
  const groups = filteredZones.reduce((acc, curr) => {
    if (!acc[curr.group]) {
      acc[curr.group] = [];
    }
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, CountryTimezone[]>);

  const handleSelect = (zoneValue: string) => {
    onChange(zoneValue);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setSearchQuery(''); // Clear on focus to let them see all options
    setIsOpen(true);
  };

  const selectedZoneLabel = allZones.find(z => z.value === value)?.label || value;

  // Ordered groups for display
  const groupOrder = ['常用与亚洲', '美洲', '欧洲与非洲', '大洋洲', '协调世界时'];

  return (
    <div className="timezone-search-container" ref={containerRef}>
      <div className="input-icon-wrapper">
        <Globe className="input-icon" size={18} />
        <input
          type="text"
          className="form-input"
          placeholder="搜索国家、城市或时区...（例如：中国、伦敦）"
          value={isOpen ? searchQuery : selectedZoneLabel}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          style={{ paddingRight: '40px' }}
        />
        <ChevronDown 
          size={16} 
          className="input-icon" 
          style={{ left: 'auto', right: '14px', cursor: 'pointer', pointerEvents: 'auto' }}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="timezone-dropdown">
          {Object.keys(groups).length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              没有找到匹配的地区或时区
            </div>
          ) : (
            groupOrder.map(groupName => {
              const items = groups[groupName];
              if (!items || items.length === 0) return null;

              return (
                <div key={groupName}>
                  <div className="timezone-group-header">{groupName}</div>
                  {items.map(z => (
                    <div
                      key={z.value}
                      className={`timezone-option ${z.value === value ? 'selected' : ''}`}
                      onClick={() => handleSelect(z.value)}
                    >
                      <span>{z.label}</span>
                      {z.value === value && <Check size={14} className="selected-check" />}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
