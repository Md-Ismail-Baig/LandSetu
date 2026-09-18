import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIntegratedView } from '../services/api';
import OneIntegratedParcelView from '../components/OneIntegratedParcelView';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function IntegratedParcelPage() {
  const { ulpin } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadParcel = async () => {
      if (!ulpin) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getIntegratedView(ulpin);
        setData(res);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadParcel();
  }, [ulpin]);

  if (loading) return <LoadingState message={`Fetching unified parcel records for ${ulpin}...`} />;
  if (error) return <ErrorMessage message={error.message || 'Parcel record could not be loaded.'} onRetry={() => navigate('/search')} />;
  if (!data) return null;

  return <OneIntegratedParcelView data={data} onBackToSearch={() => navigate('/search')} />;
}
